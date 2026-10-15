#!/usr/bin/env node
// Verify the latest bilingual editorial exercise against the generated static site.
// This is a technical check; it does not claim to replace editorial review.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const puzzles=JSON.parse(fs.readFileSync('data/puzzles.json','utf8'));
const ids=new Set();
for (const p of puzzles) {
  assert(p.id && !ids.has(p.id), 'Duplicate or missing puzzle id: '+p.id);
  ids.add(p.id);
  if (!p.coach || !p.quick) continue;
  assert(p.quick.options.length===3, 'Expected three options: '+p.id);
  assert(p.quick.options.some(o=>o.id===p.quick.correctId), 'Invalid correctId: '+p.id);
  assert(new Set(p.coach.criteria.map(c=>c.id)).size===p.coach.criteria.length, 'Duplicated mentor criterion: '+p.id);
}
const recent=[...puzzles].filter(p=>p.coach).sort((a,b)=>b.date.localeCompare(a.date))[0];
assert(recent,'Missing dated exercise with mentor criteria');
const en=fs.readFileSync('src/data/puzzles-en.ts','utf8');
const coachEn=JSON.parse(fs.readFileSync('data/puzzle-coach-en.json','utf8'));
const catalogue=fs.readFileSync('src/data/catalogue.ts','utf8');
assert(en.includes("'"+recent.id+"':"), 'Missing EN exercise: '+recent.id);
assert(coachEn[recent.id], 'Missing EN mentor criteria: '+recent.id);
assert(catalogue.includes("'"+recent.id+"':"), 'Missing practice catalogue group: '+recent.id);
assert.deepEqual(recent.coach.criteria.map(c=>c.id),coachEn[recent.id].criteria.map(c=>c.id),'PL/EN mentor criteria mismatch');
const routes=[
  'lamiglowki/'+recent.id+'/index.html',
  'en/practice/'+recent.id+'/index.html',
  'rss.xml', 'en/rss.xml','sitemap.xml'
];
for(const route of routes) assert(fs.existsSync(path.join('dist',route)),'Missing built route: '+route);
for(const [locale,route] of [['pl','rss.xml'],['en','en/rss.xml']]){
 const rss=fs.readFileSync(path.join('dist',route),'utf8');
 assert(rss.includes(recent.id),'Latest '+locale+' puzzle is absent from RSS');
}
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
assert(sitemap.includes(recent.id),'Latest puzzle absent from sitemap');
for(const locale of ['lamiglowki','en/practice']){
 const html=fs.readFileSync(path.join('dist',locale,recent.id,'index.html'),'utf8');
 assert(html.includes(recent.title) || locale==='en/practice','Polish puzzle heading absent');
 assert(html.length>1500,'Suspiciously short puzzle HTML');
}
console.log('Editorial route smoke checks passed for '+recent.id);
