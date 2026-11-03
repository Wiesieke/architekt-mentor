#!/usr/bin/env node
/**
 * Deterministic editorial preflight for new PL/EN article files.
 * This DOES NOT certify accuracy, rights, semantic equivalence or naturalness.
 * Fails closed on specific high-confidence structural/linguistic errors.
 *
 * Usage: node scripts/am-editorial-gate.mjs --changed
 *          node scripts/am-editorial-gate.mjs --all
 *
 * --changed: compare workflow HEAD against PR_BASE_SHA using git diff.
 * --all: review all article HTML currently in repository (diagnostic only).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const CONTENT_PREFIX = 'src/content/articles/';
const HTML_FILE = /^src\/content\/articles\/(?:en\/)?[a-z0-9][a-z0-9-]*\.html$/;
const PL_INDEX = 'src/data/articles.ts';
const EN_INDEX = 'src/data/articles-en.ts';
const allowed = new Set(['--changed', '--all']);

const code = (kind, file, message) => ({ kind, file, message });

export function inspectHtml(relativePath, html) {
 const issues = [];
 const file = relativePath;
 if (typeof html !== 'string' || html.trim().length < 300)
   return [code('BODY_TOO_SHORT', file, 'Missing or suspiciously short article')];
 const singleItemLists = [...html.matchAll(/<ol(?:\s[^>]*)?>\s*<li>[^<]{8,260}<\/li>\s*<\/ol>/gis)];
 if (singleItemLists.length >= 3) {
   issues.push(code('NUMBERED_HEADINGS_AS_LISTS',file,
      'Three or more one-item ordered lists look like converted numbered headings; use ## headings in Desk'));
 }
 // Only inspect articles longer than ~250 words; short articles need not be sectioned.
 const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
 if (plain.split(/\s+/u).length >= 250 && !/<h[2-4]\b/i.test(html)) {
   issues.push(code('LONG_ARTICLE_WITHOUT_SECTION_HEADINGS',file,
      'Long article needs semantic headings (## / ###), not numbered one-line lists'));
 }
 // A standalone editorial label is invalid ONLY as a paragraph.
 // A semantic H2/H3 heading satisfies the editorial requirement.
 if (/<p(?:\s[^>]*)?>\s*(?:<strong>\s*)?(?:Interpretacja ArchitectMentor|Ocena architektoniczna|Stanowisko ArchitectMentor|Architectmentor interpretation|Architectmentor application|architectural assessment|documented example|Architectmentor's position)\s*(?:<\/strong>\s*)?<\/p>/im.test(html)) {
   issues.push(code('EDITORIAL_LABEL_AS_PARAGRAPH',file,
      'Editorial section label must be a meaningful Markdown heading, not an unformatted paragraph'));
 }
 if (file.includes('/en/')) {
   const phrases = [
     /in ai systems, this directory does not disappear/i,
     /catalog(?:ue)? of the final products of the agreement/i,
     /perform operations by an api/i,
     /the model['’]s creator with the public research institution/i,
     /the appropriate result of such initiatives could be/i,
     /it is added to new risk areas/i
   ];
   if (phrases.some(re => re.test(plain))) {
     issues.push(code('KNOWN_MACHINE_TRANSLATION_CALQUE',file,
       'English contains a high-confidence literal translation; request natural editorial rewriting'));
   }
 }
 if (!file.includes('/en/') && /CERT Polska/i.test(html) && /MikroTik/i.test(html)
     && !/(?:https:\/\/(?:www\.)?(?:cert\.pl|nask\.pl)\/)/i.test(html)) {
   issues.push(code('SECONDARY_CLAIM_UNCITED',file,
     'Specific CERT Polska / MikroTik research claims need an original reference link'));
 }
 return issues;
}

export function inspectPolishCatalogDiff(patch) {
 const issues = [];
 for (const line of patch.split('\n')) {
   if (!line.startsWith('+') || line.startsWith('+++') ||
       !/\btitle\s*:\s*["']/.test(line)) continue;
   const match = line.match(/\btitle\s*:\s*"((?:\\.|[^"])*)"/) ||
                 line.match(/\btitle\s*:\s*'((?:\\.|[^'])*)'/);
   if (!match) continue;
   const title = match[1];
   const words = title.toLowerCase().match(/\b(?:the|and|with|why|how|what|partner|to|advance|safety|security|architecture|its|whose|systems)\b/g) || [];
   if (words.length >= 4) {
     issues.push(code('PL_TITLE_LOOKS_ENGLISH',PL_INDEX,
       'Polish article title looks English; supply a natural Polish headline in Desk'));
   }
 }
 return issues;
}

function git(...args) {
 return execFileSync('git',args,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:20000}).trim();
}
function changed() {
 const base = process.env.PR_BASE_SHA;
 if (!/^[a-f0-9]{40}$/i.test(base || ''))
   throw new Error('PR_BASE_SHA must be the exact trusted base commit');
 return git('diff','--name-only',base,'HEAD','--',CONTENT_PREFIX,PL_INDEX,EN_INDEX)
   .split('\n').filter(Boolean);
}
function allHtml() {
 const dir=path.join(ROOT,CONTENT_PREFIX);
 return ['','en/'].flatMap(prefix =>
   fs.readdirSync(path.join(dir,prefix),{withFileTypes:true})
     .filter(e=>e.isFile()&&e.name.endsWith('.html'))
     .map(e=>CONTENT_PREFIX+prefix+e.name));
}
function markdownSummary(issues) {
 const rows=issues.map(x=>'- **'+x.kind+'** (`'+x.file+'`): '+x.message);
 return ['## Automated editorial preflight',
  issues.length===0?'**PASS** — no deterministic blocker detected. This is not human language or fact verification.':
  '**BLOCKED** — correct in Desk and approve a NEW revision. Do not silently change an approved snapshot.',
  '',...rows,'',
  '> Automated checks cannot establish factual correctness, natural translation, copyright permission or source reliability.'].join('\n');
}
export function scan(files, read, plPatch='') {
 let issues=[];
 for(const file of files.filter(f=>HTML_FILE.test(f)))issues.push(...inspectHtml(file,read(file)));
 if (plPatch) issues.push(...inspectPolishCatalogDiff(plPatch));
 return issues;
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
 const args=process.argv.slice(2);
 if(args.length!==1 || !allowed.has(args[0]))throw new Error('Use --changed or --all');
 const files=args[0]==='--changed'?changed():allHtml();
 const patch= args[0]==='--changed' && files.includes(PL_INDEX)?
   git('diff',process.env.PR_BASE_SHA,'HEAD','--',PL_INDEX):'';
 const issues=scan(files,relative=>fs.readFileSync(path.join(ROOT,relative),'utf8'),patch);
 const report=markdownSummary(issues);
 console.log(report);
 const summary=process.env.GITHUB_STEP_SUMMARY;
 if(summary)fs.appendFileSync(summary,report+'\n');
 if(issues.length)process.exitCode=1;
}
