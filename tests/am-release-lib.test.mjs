import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parseApprovedJob, safeMarkdown, escapeHtml } from '../scripts/am-release-lib.mjs';

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
