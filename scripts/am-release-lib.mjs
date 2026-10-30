import { validateExercisePayload, makeExerciseReleaseFiles } from './am-exercise-release.mjs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { marked, Renderer } from 'marked';

// Curated exceptions for already approved immutable Desk snapshots without a
// learning_group hint. Do not infer taxonomy from the free-text article title.
const CURATED_FOUNDATION_GROUPS = Object.freeze({
  'AM-PR-1-R1': 'integration'
});
const FOUNDATION_GROUP_IDS = Object.freeze([
  'integration', 'analysis', 'resilience', 'security', 'quality', 'description'
]);

const SECTIONS = Object.freeze({
  'Architektura w ruchu': ['architektura-w-ruchu', 'architecture-in-motion'],
  'Podstawy architektury': ['podstawy-architektury', 'foundations'],
  'Architektura IT w dobie AI': ['architektura-it-ai', 'architecture-with-ai'],
  'Architektura IT i AI': ['architektura-it-ai', 'architecture-with-ai']
});

function requireText(value, name, minimum, maximum = 40000) {
  assert.equal(typeof value, 'string', name + ' must be text');
  const text = value.trim();
  assert(text.length >= minimum && text.length <= maximum, name + ' has invalid length');
  return text;
}
function validHttps(url) {
  if (typeof url !== 'string' || url.length > 2048) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname && !parsed.username && !parsed.password;
  } catch { return false; }
}
function slugify(value) {
  return value.toLowerCase().replace(/ł/g, 'l').replace(/Ł/g, 'l')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function secureSlug(title, candidate) {
  const prefix = slugify(title).slice(0, 58).replace(/-+$/g, '');
  const suffix = slugify(candidate);
  assert(prefix.length >= 5 && suffix.length >= 6, 'Bad slug input');
  return prefix + '-' + suffix;
}
export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeHref(href) {
  if (typeof href !== 'string' || href.length > 2048) return null;
  if (href.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) return href;
  if (!validHttps(href)) return null;
  return new URL(href).href;
}
export function safeMarkdown(markdown) {
  const renderer = new Renderer();
  renderer.html = function ({ text }) { return escapeHtml(text); };
  renderer.image = function ({ text }) { return escapeHtml(text); };
  renderer.link = function ({ href, title, tokens }) {
    const label = this.parser.parseInline(tokens);
    const url = safeHref(href);
    if (!url) return label;
    const titleAttr = title ? ' title="' + escapeHtml(title) + '"' : '';
    return '<a href="' + escapeHtml(url) + '"' + titleAttr + ' rel="noopener noreferrer">' + label + '</a>';
  };
  const html = marked.parse(markdown, { renderer, gfm: true, async: false });
  assert.equal(typeof html, 'string', 'Markdown renderer must be synchronous');
  return html;
}
export function parseApprovedJob(job) {
  assert(job && typeof job === 'object', 'Missing release job');
  assert(Number.isSafeInteger(job.job_id) && job.job_id > 0, 'Invalid job id');
  assert(typeof job.handoff_json === 'string' && job.handoff_json.length <= 180000, 'Invalid handoff bytes');
  assert(/^[a-f0-9]{64}$/.test(job.content_sha256 ?? ''), 'Invalid handoff hash');
  const actual = crypto.createHash('sha256').update(job.handoff_json, 'utf8').digest('hex');
  assert.equal(actual, job.content_sha256, 'Approved snapshot checksum mismatch');
  const h = JSON.parse(job.handoff_json);
  assert.equal(h.schema_version, 2);
  assert.equal(h.project, 'ArchitectMentor');
  assert.equal(h.purpose, 'explicit_publication_job');
  assert.equal(h.target_repository, 'Wiesieke/architekt-mentor');
  assert.equal(h.publication_authorized, true);
  assert.equal(h.publication_performed, false);
  assert.equal(h.approval?.status, 'APPROVED');
  assert.equal(h.inbox_id, job.inbox_id);
  assert.equal(h.approved_revision, job.revision);
  assert(/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(h.candidate_id ?? ''), 'Invalid candidate');
  requireText(h.approval.by, 'approver', 3, 100);
  requireText(h.approval.at_utc, 'approval date', 16, 40);
  requireText(h.release?.requested_by, 'publisher', 3, 100);
  requireText(h.release?.requested_at_utc, 'release date', 16, 40);
  assert(validHttps(h.source?.url), 'Invalid primary source');
  assert(/^[a-f0-9]{40}$/.test(h.source?.source_blob_sha ?? ''), 'Invalid source Git SHA');
  // A puzzle cannot be published as a plain article. Require the separate
  // structured, dual-mode exercise workflow instead of silently losing modes.
  const format = String(h.editorial_hint?.format ?? '').trim().toLocaleLowerCase('pl');
  const exerciseRequested=['łamigłówka','lamiglowka','puzzle','exercise','ćwiczenie','cwiczenie'].some(tag=>format.includes(tag));
  assert(!exerciseRequested || h.exercise,
    'Interactive exercise format requires PL/EN quick decision and mentor registration; article-only publication is forbidden');
  const category = requireText(h.editorial_hint?.category, 'category', 5, 120);
  const sections = SECTIONS[category];
  assert(sections, 'Unsupported ArchitectMentor section');
  const learningGroup = sections[0] === 'podstawy-architektury'
    ? (h.editorial_hint?.learning_group ?? CURATED_FOUNDATION_GROUPS[h.candidate_id])
    : null;
  if(sections[0] === 'podstawy-architektury') {
    assert(FOUNDATION_GROUP_IDS.includes(learningGroup),
      'Foundation article requires exactly one curated learning_group: ' + h.candidate_id);
  }
  const pl = h.content?.pl, en = h.content?.en;
  const texts = {
    pl: {
      title: requireText(pl?.title, 'PL title', 5, 500),
      lead: requireText(pl?.lead, 'PL lead', 40, 4000),
      body: requireText(pl?.body_markdown, 'PL body', 150)
    },
    en: {
      title: requireText(en?.title, 'EN title', 5, 500),
      lead: requireText(en?.lead, 'EN lead', 40, 4000),
      body: requireText(en?.body_markdown, 'EN body', 150)
    }
  };
  const slugPl = secureSlug(texts.pl.title, h.candidate_id);
  const slugEn = secureSlug(texts.en.title, h.candidate_id);
  const exercise = exerciseRequested ? validateExercisePayload(h.exercise) : null;
  assert(!exercise || sections[0]==='podstawy-architektury',
    'Interactive exercise requires a linked Foundations learning article');
  const branch = 'release/' + h.candidate_id.toLowerCase() + '-r' + h.approved_revision;
  const articleUrls = {
    pl: 'https://ejsymont.com/' + sections[0] + '/' + slugPl + '/',
    en: 'https://ejsymont.com/en/' + sections[1] + '/' + slugEn + '/'
  };
  const urls = exercise ? {
    pl: 'https://ejsymont.com/lamiglowki/' + exercise.id + '/',
    en: 'https://ejsymont.com/en/practice/' + exercise.id + '/'
  } : articleUrls;
  return { h, texts, sections, category, learningGroup, slugPl, slugEn, branch, urls, articleUrls, exercise };
}
function summary(text, length) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= length) return normalized;
  return normalized.slice(0, length - 1).replace(/\s+\S*$/u, '') + '…';
}
function authorImportVar(candidate, locale) {
  return 'am' + candidate.replace(/[^0-9a-z]/gi, '') + (locale === 'pl' ? 'Pl' : 'En');
}
function injectIndex(src, importLine, declaration, entry, slug) {
  assert(!src.includes('slug:"' + slug + '"') && !src.includes("slug:'" + slug + "'"),
    'Article slug already present in catalogue');
  assert(src.includes(declaration), 'Articles catalogue schema changed unexpectedly');
  assert(!src.includes(importLine), 'Article import already exists');
  return importLine + src.replace(declaration, declaration + '\n  ' + entry + ',');
}
export function makeReleaseFiles(root, parsed, date) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 'Invalid UTC publication date');
  const plIndexPath = path.join(root, 'src/data/articles.ts');
  const enIndexPath = path.join(root, 'src/data/articles-en.ts');
  const plHtmlPath = path.join(root, 'src/content/articles', parsed.slugPl + '.html');
  const enHtmlPath = path.join(root, 'src/content/articles/en', parsed.slugEn + '.html');
  assert(!fs.existsSync(plHtmlPath) && !fs.existsSync(enHtmlPath),
    'Article HTML already exists; revisions require a separate correction workflow');
  const plVariable = authorImportVar(parsed.h.candidate_id, 'pl');
  const enVariable = authorImportVar(parsed.h.candidate_id, 'en');
  const plImport = "import " + plVariable + " from '../content/articles/" + parsed.slugPl + ".html?raw';\n";
  const enImport = "import " + enVariable + " from '../content/articles/en/" + parsed.slugEn + ".html?raw';\n";
  const plEntry = '{ section:' + JSON.stringify(parsed.sections[0]) +
    ', slug:' + JSON.stringify(parsed.slugPl) +
    ', title:' + JSON.stringify(parsed.texts.pl.title) +
    ', description:' + JSON.stringify(summary(parsed.texts.pl.lead, 240)) +
    ', topic:' + JSON.stringify(parsed.category) +
    ', published:' + JSON.stringify(date) +
    ", authorId:'architectmentor', body:" + plVariable + ' }';
  const enEntry = '{ section:' + JSON.stringify(parsed.sections[1]) +
    ', slug:' + JSON.stringify(parsed.slugEn) +
    ', plSlug:' + JSON.stringify(parsed.slugPl) +
    ', title:' + JSON.stringify(parsed.texts.en.title) +
    ', description:' + JSON.stringify(summary(parsed.texts.en.lead, 240)) +
    ', topic:' + JSON.stringify(parsed.category) +
    ', published:' + JSON.stringify(date) +
    ", authorId:'architectmentor', body:" + enVariable + ' }';
  const srcPl = fs.readFileSync(plIndexPath, 'utf8');
  const srcEn = fs.readFileSync(enIndexPath, 'utf8');
  const nextPl = injectIndex(srcPl, plImport, 'export const articles: Article[] = [', plEntry, parsed.slugPl);
  const nextEn = injectIndex(srcEn, enImport, 'export const englishArticles: EnglishArticle[] = [', enEntry, parsed.slugEn);
  const source = escapeHtml(parsed.h.source.url);
  // Explicit editorial flag, with a legacy safeguard for the private synthetic
  // practice-series candidate namespace when the Desk has not yet been upgraded.
  const fictional = parsed.h.editorial_hint?.fictional_scenario === true
    || /^AM-PR-[A-Za-z0-9_-]+$/.test(parsed.h.candidate_id);
  const sourcePl = fictional
    ? '<div class="source"><strong>Scenariusz fikcyjny.</strong> ' +
      'Źródło wzorca architektonicznego: <a href="' + source +
      '" rel="noopener noreferrer">' + source + '</a>. ' +
      'Link nie dokumentuje przedstawionego zdarzenia.</div>'
    : '<div class="source"><strong>Źródło pierwotne:</strong> <a href="' +
      source + '" rel="noopener noreferrer">' + source + '</a>. Analiza ArchitectMentor.</div>';
  const sourceEn = fictional
    ? '<div class="source"><strong>Fictional teaching scenario.</strong> ' +
      'Architecture pattern reference: <a href="' + source +
      '" rel="noopener noreferrer">' + source + '</a>. ' +
      'This link does not document the described events.</div>'
    : '<div class="source"><strong>Primary source:</strong> <a href="' +
      source + '" rel="noopener noreferrer">' + source + '</a>. ArchitectMentor analysis.</div>';
  const files = [
    { path: plIndexPath, content: nextPl },
    { path: enIndexPath, content: nextEn },
    { path: plHtmlPath, content: safeMarkdown(parsed.texts.pl.body) + '\n' + sourcePl + '\n' },
    { path: enHtmlPath, content: safeMarkdown(parsed.texts.en.body) + '\n' + sourceEn + '\n' }
  ];
  if (parsed.sections[0] === 'podstawy-architektury') {
    const learningPath = path.join(root, 'src/data/learning.ts');
    const current = fs.readFileSync(learningPath, 'utf8');
    assert(!current.includes("'" + parsed.slugPl + "'"),
      'Foundation slug already classified; do not write twice');
    const group = parsed.learningGroup;
    assert(FOUNDATION_GROUP_IDS.includes(group), 'Unapproved learning group');
    const pattern = new RegExp("({ id: '" + group + "'[^\\n]*slugs: \\[)([^\\]]*)(\\])");
    const matches = [...current.matchAll(new RegExp(pattern.source, 'g'))];
    assert.equal(matches.length, 1, 'Learning taxonomy shape changed: ' + group);
    const next = current.replace(pattern, (_match, before, slugs, after) =>
      before + slugs + ", '" + parsed.slugPl + "'" + after);
    assert(next !== current, 'Learning group insertion failed');
    files.push({ path: learningPath, content: next });
  }
  if (parsed.exercise) {
    files.push(...makeExerciseReleaseFiles(root, parsed, date));
    const id = parsed.exercise.id;
    files.find(f=>f.path===plHtmlPath).content +=
      '<p><a href="/lamiglowki/' + id + '/">Przećwicz decyzję: szybki wybór lub mentor →</a></p>\n';
    files.find(f=>f.path===enHtmlPath).content +=
      '<p><a href="/en/practice/' + id + '/">Practice this decision: quick choice or mentor →</a></p>\n';
  }
  return files;
}
export function writeReleaseFiles(files) {
  for (const item of files) {
    assert(!item.path.includes('\0'), 'Unsafe output path');
    fs.writeFileSync(item.path, item.content, { flag: 'w' });
  }
}
export function verifyBuiltRelease(root, parsed) {
  const paths = [
    path.join(root, 'dist', parsed.sections[0], parsed.slugPl, 'index.html'),
    path.join(root, 'dist', 'en', parsed.sections[1], parsed.slugEn, 'index.html')
  ];
  for (const item of paths) {
    assert(fs.existsSync(item), 'Missing article page: ' + item);
    assert(fs.readFileSync(item, 'utf8').length > 2000, 'Suspiciously short page');
  }
  const rssPl = fs.readFileSync(path.join(root, 'dist/rss.xml'), 'utf8');
  const rssEn = fs.readFileSync(path.join(root, 'dist/en/rss.xml'), 'utf8');
  const sitemap = fs.readFileSync(path.join(root, 'dist/sitemap.xml'), 'utf8');
  assert(rssPl.includes(parsed.slugPl), 'PL RSS missing release');
  assert(rssEn.includes(parsed.slugEn), 'EN RSS missing release');
  assert(sitemap.includes(parsed.slugPl) && sitemap.includes(parsed.slugEn), 'Sitemap missing release');
  if(parsed.exercise) {
    const id=parsed.exercise.id;
    for(const p of ['lamiglowki/'+id+'/index.html','en/practice/'+id+'/index.html']){
      const content=fs.readFileSync(path.join(root,'dist',p),'utf8');
      assert(content.length>1500,'Suspiciously short exercise page: '+p);
    }
    assert(rssPl.includes(id)&&rssEn.includes(id),'Exercise missing from PL/EN RSS');
    assert(sitemap.includes(id),'Exercise missing from sitemap');
  }
}
