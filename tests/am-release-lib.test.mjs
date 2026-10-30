import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseApprovedJob, safeMarkdown, escapeHtml, makeReleaseFiles, writeReleaseFiles } from '../scripts/am-release-lib.mjs';

function goodJob() {
  const bodyPl = '## Architektura\n' + 'Rozważmy granice odpowiedzialności i weryfikację dowodów. '.repeat(5);
  const bodyEn = '## Architecture\n' + 'Consider responsibility boundaries and evidence verification. '.repeat(5);
  const h = {
    schema_version: 2, project: 'ArchitectMentor',
    purpose: 'explicit_publication_job', target_repository: 'Wiesieke/architekt-mentor',
    publication_authorized: true, publication_performed: false,
    inbox_id: 7, candidate_id: 'AM-20261029-001', approved_revision: 2,
    approval: {status: 'APPROVED',by: 'lh:wiesieke',at_utc:'2026-10-29 15:30:24'},
    release: {requested_by:'lh:wiesieke', requested_at_utc:'2026-10-29 15:50:00'},
    source: {url:'https://github.blog/changelog/example/',source_blob_sha:'a'.repeat(40)},
    editorial_hint: {category:'Architektura w ruchu',format:'analysis'},
    content: {
      pl: {title:'Agenci AI a granice architektury',lead:'Znaczenie wyraźnych granic odpowiedzialności w systemach IT i procesie wydawania.',body_markdown:bodyPl},
      en: {title:'AI agents and architecture boundaries',lead:'Why explicit responsibility boundaries matter in IT systems and editorial delivery.',body_markdown:bodyEn}
    }
  };
  const handoff_json=JSON.stringify(h);
  return {job_id:23,inbox_id:7,revision:2,handoff_json,
    content_sha256:crypto.createHash('sha256').update(handoff_json).digest('hex')};
}

test('requires exact approved revision, source and token-independent checksum',()=>{
 const job=goodJob();
 const parsed=parseApprovedJob(job);
 assert.equal(parsed.sections[0],'architektura-w-ruchu');
 assert.equal(parsed.sections[1],'architecture-in-motion');
 assert(parsed.slugPl.endsWith('am-20261029-001'));
 assert(parsed.urls.en.startsWith('https://ejsymont.com/en/architecture-in-motion/'));
 assert.throws(()=>parseApprovedJob({...job,revision:3}));
 assert.throws(()=>parseApprovedJob({...job,content_sha256:'0'.repeat(64)}));
 const h=JSON.parse(job.handoff_json);h.publication_authorized=false;
 const handoff_json=JSON.stringify(h);
 const altered={...job,handoff_json,content_sha256:crypto.createHash('sha256').update(handoff_json).digest('hex')};
 assert.throws(()=>parseApprovedJob(altered));
});

test('does not render raw HTML, script links or injected images',()=>{
 const html=safeMarkdown('**Hello** <script>alert(1)</script>\n\n[bad](javascript:alert(1)) and [good](https://example.com/a?q=1&x=2) ![image](data:image/svg+xml,evil)');
 assert(html.includes('<strong>Hello</strong>'));
 assert(!html.includes('<script>'));
 assert(html.includes('&lt;script&gt;'));
 assert(!html.includes('href="javascript:'));
 assert(!html.includes('<img'));
 assert(html.includes('href="https://example.com/a?q=1&amp;x=2"'));
 assert.equal(escapeHtml('<a "b">'),'&lt;a &quot;b&quot;&gt;');
});

test('rejects unsupported section even with a correctly recomputed hash',()=>{
 const job=goodJob();
 const h=JSON.parse(job.handoff_json);h.editorial_hint.category='Niezatwierdzona kategoria';
 const handoff_json=JSON.stringify(h);
 const changed={...job,handoff_json,content_sha256:crypto.createHash('sha256').update(handoff_json).digest('hex')};
 assert.throws(()=>parseApprovedJob(changed));
});

test('generates two linked language editions from real catalogue layouts without touching the checkout',()=>{
 const parsed=parseApprovedJob(goodJob());
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'am-release-catalog-'));
 try {
  const dataDir=path.join(temp,'src/data');
  fs.mkdirSync(dataDir,{recursive:true});
  fs.mkdirSync(path.join(temp,'src/content/articles/en'),{recursive:true});
  for(const name of ['articles.ts','articles-en.ts'])
   fs.copyFileSync(path.join(process.cwd(),'src/data',name),path.join(dataDir,name));
  const files=makeReleaseFiles(temp,parsed,'2026-10-29');
  assert.equal(files.length,4);
  writeReleaseFiles(files);
  const plIndex=fs.readFileSync(path.join(dataDir,'articles.ts'),'utf8');
  const enIndex=fs.readFileSync(path.join(dataDir,'articles-en.ts'),'utf8');
  assert(plIndex.includes('slug:"'+parsed.slugPl+'"'));
  assert(enIndex.includes('slug:"'+parsed.slugEn+'"'));
  assert(enIndex.includes('plSlug:"'+parsed.slugPl+'"'));
  assert(plIndex.includes("published:\"2026-10-29\""));
  assert(fs.readFileSync(path.join(temp,'src/content/articles',parsed.slugPl+'.html'),'utf8').includes('Źródło pierwotne'));
  assert(fs.readFileSync(path.join(temp,'src/content/articles/en',parsed.slugEn+'.html'),'utf8').includes('Primary source'));
  assert.throws(()=>makeReleaseFiles(temp,parsed,'2026-10-29'),'Duplicate article must fail closed');
 } finally {
  fs.rmSync(temp,{recursive:true,force:true});
 }
});

test('labels approved fictional practice scenarios as synthetic and cites patterns, not event evidence',()=>{
 const original=goodJob();
 const h=JSON.parse(original.handoff_json);
 h.candidate_id='AM-PR-1-R1';
 h.editorial_hint={category:'Podstawy architektury',format:'łamigłówka',
  fictional_scenario:true,series:'Z praktyki architekta'};
 h.source.url='https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/';
 const handoff_json=JSON.stringify(h);
 const parsed=parseApprovedJob({...original,handoff_json,
  content_sha256:crypto.createHash('sha256').update(handoff_json).digest('hex')});
 assert.equal(parsed.sections[0],'podstawy-architektury');
 assert.equal(parsed.sections[1],'foundations');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'am-release-fiction-'));
 try {
  const dataDir=path.join(temp,'src/data');
  fs.mkdirSync(dataDir,{recursive:true});
  fs.mkdirSync(path.join(temp,'src/content/articles/en'),{recursive:true});
  for(const name of ['articles.ts','articles-en.ts'])
   fs.copyFileSync(path.join(process.cwd(),'src/data',name),path.join(dataDir,name));
  const files=makeReleaseFiles(temp,parsed,'2026-10-30');
  const pl=files.find(f=>f.path.endsWith(parsed.slugPl+'.html')).content;
  const en=files.find(f=>f.path.endsWith(parsed.slugEn+'.html')).content;
  assert(pl.includes('Scenariusz fikcyjny.'));
  assert(pl.includes('Źródło wzorca architektonicznego:'));
  assert(!pl.includes('Źródło pierwotne:'));
  assert(en.includes('Fictional teaching scenario.'));
  assert(en.includes('Architecture pattern reference:'));
  assert(!en.includes('Primary source:'));
 } finally {
  fs.rmSync(temp,{recursive:true,force:true});
 }
});

test('release adds newly approved learning article to exactly one curated taxonomy group',()=>{
 const job=goodJob();
 const handoff=JSON.parse(job.handoff_json);
 handoff.candidate_id='AM-PR-1-R1';
 handoff.editorial_hint={category:'Podstawy architektury',format:'łamigłówka',fictional_scenario:true};
 const raw=JSON.stringify(handoff);
 const parsed=parseApprovedJob({...job,handoff_json:raw,
  content_sha256:crypto.createHash('sha256').update(raw).digest('hex')});
 assert.equal(parsed.learningGroup,'integration');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'am-release-group-'));
 try{
  const dataDir=path.join(temp,'src/data');
  fs.mkdirSync(dataDir,{recursive:true});
  fs.mkdirSync(path.join(temp,'src/content/articles/en'),{recursive:true});
  for(const file of ['articles.ts','articles-en.ts','learning.ts'])
   fs.copyFileSync(path.join(process.cwd(),'src/data',file),path.join(dataDir,file));
  const files=makeReleaseFiles(temp,parsed,'2026-10-30');
  assert.equal(files.length,5);
  const tax=files.find(x=>x.path.endsWith('/learning.ts')).content;
  const slug=parsed.slugPl;
  assert(tax.includes("'"+slug+"'"));
  const sets=[...tax.matchAll(/slugs:\s*\[([^\]]*)\]/g)];
  assert.equal(sets.filter(x=>x[1].includes("'"+slug+"'")).length,1);
  writeReleaseFiles(files);
  assert.throws(()=>makeReleaseFiles(temp,parsed,'2026-10-30'),
   'Previously classified article cannot be repeated');
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('new foundation articles require controlled editorial grouping',()=>{
 const job=goodJob();
 const h=JSON.parse(job.handoff_json);
 h.candidate_id='AM-PR-999999-R1';
 h.editorial_hint={category:'Podstawy architektury',format:'łamigłówka'};
 const raw=JSON.stringify(h);
 assert.throws(()=>parseApprovedJob({...job,handoff_json:raw,
  content_sha256:crypto.createHash('sha256').update(raw).digest('hex')}),
  /curated learning_group/);
 h.editorial_hint.learning_group='integration';
 const valid=JSON.stringify(h);
 assert.equal(parseApprovedJob({...job,handoff_json:valid,
  content_sha256:crypto.createHash('sha256').update(valid).digest('hex')}).learningGroup,'integration');
});
