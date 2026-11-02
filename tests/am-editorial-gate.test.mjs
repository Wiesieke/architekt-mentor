import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectHtml, inspectPolishCatalogDiff, scan } from '../scripts/am-editorial-gate.mjs';

const para='<p>'+('Document architecture decisions with bounded evidence and explicit responsibility. '.repeat(10))+'</p>';
const goodPL='<h2>Kontekst</h2>'+para+'<h2>Wnioski</h2>'+para;
const goodEN='<h2>Context</h2>'+para+'<h2>Conclusions</h2>'+para;

test('accepts simple semantic PL/EN structure without claiming semantic equivalence',()=>{
 assert.deepEqual(inspectHtml('src/content/articles/a.html',goodPL),[]);
 assert.deepEqual(inspectHtml('src/content/articles/en/a.html',goodEN),[]);
});

test('rejects repeated numbered headings converted into singleton lists',()=>{
 const html=['<ol><li>What was actually announced?</li></ol>',
 '<p>'+('Relevant evidence and scope. '.repeat(30))+'</p>',
 '<ol start="2"><li>From model to system security</li></ol>',
 '<p>'+('Security controls and evidence. '.repeat(30))+'</p>',
 '<ol start="3"><li>What should an architect do?</li></ol>',
 '<p>'+('Actionable checks and ownership. '.repeat(30))+'</p>'].join('\n');
 const codes=inspectHtml('src/content/articles/en/nask.html',html).map(x=>x.kind);
 assert(codes.includes('NUMBERED_HEADINGS_AS_LISTS'));
 assert(codes.includes('LONG_ARTICLE_WITHOUT_SECTION_HEADINGS'));
});

test('detects factual claim without primary citation and literal English calque',()=>{
 const html='<h2>Section</h2><p>CERT Polska studied MikroTik vulnerabilities without linking the report.</p>'+para;
 assert(inspectHtml('src/content/articles/example.html',html).some(x=>x.kind==='SECONDARY_CLAIM_UNCITED'));
 const en='<h2>Security</h2><p>In AI systems, this directory does not disappear.</p>'+para;
 assert(inspectHtml('src/content/articles/en/example.html',en).some(x=>x.kind==='KNOWN_MACHINE_TRANSLATION_CALQUE'));
});
test('flags English headline in PL index but permits Polish title with IT terms',()=>{
 assert(inspectPolishCatalogDiff('+  {title:"OpenAI and Poland’s NASK partner to advance AI safety and security"},')
   .some(x=>x.kind==='PL_TITLE_LOOKS_ENGLISH'));
 assert.deepEqual(inspectPolishCatalogDiff('+  {title:"Bezpieczeństwo AI: odpowiedzialność dostawcy i architekta"},'),[]);
});
test('ignores unrelated changes, checks only changed new article files',()=>{
 const files=['README.md','src/content/articles/new-article.html','src/content/articles/en/new-article.html'];
 const fixture={'src/content/articles/new-article.html':goodPL,'src/content/articles/en/new-article.html':goodEN};
 assert.deepEqual(scan(files,file=>fixture[file],'+ {title:"Bezpieczeństwo sztucznej inteligencji"}'),[]);
});
