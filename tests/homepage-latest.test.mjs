import test from 'node:test';
import assert from 'node:assert/strict';
import { assembleLatestEdition } from '../src/data/homepage-latest.mjs';

const url=a=>'/architektura-w-ruchu/'+a.slug+'/';

test('latest homepage edition includes releases automatically added to published articles',()=>{
 const manual=[{kind:'ĆWICZENIE',href:'/lamiglowki/ex/',title:'Exercise',summary:'Scenario',published:'2026-10-30'}];
 const articles=[
  {slug:'older',section:'architektura-w-ruchu',title:'Older',description:'Historical',published:'2026-10-29'},
  {slug:'linux',section:'architektura-w-ruchu',title:'CVE Linux',description:'Kernel patch',published:'2026-11-03'}
 ];
 const latest=assembleLatestEdition(manual,articles,url);
 assert.equal(latest.date,'2026-11-03');
 assert.equal(latest.entries.length,1);
 assert.equal(latest.entries[0].title,'CVE Linux');
 assert.equal(latest.entries[0].kind,'W RUCHU');
});

test('an article already present in the manual edition is not duplicated',()=>{
 const manual=[{kind:'W RUCHU',href:'/architektura-w-ruchu/release/',title:'Release',summary:'Edited',published:'2026-10-30'}];
 const articles=[{slug:'release',section:'architektura-w-ruchu',title:'Release',description:'Full article',published:'2026-10-30'}];
 const latest=assembleLatestEdition(manual,articles,url);
 assert.equal(latest.date,'2026-10-30');
 assert.equal(latest.entries.length,1);
 assert.equal(latest.entries[0].summary,'Edited');
});

test('newly published articles on same date are included without losing editorial exercises',()=>{
 const manual=[{kind:'ĆWICZENIE',href:'/lamiglowki/ex/',title:'Exercise',summary:'Scenario',published:'2026-10-30'}];
 const articles=[{slug:'new',section:'podstawy-architektury',title:'New',description:'Analysis',published:'2026-10-30'}];
 const latest=assembleLatestEdition(manual,articles,()=>'/podstawy-architektury/new/');
 assert.deepEqual(latest.entries.map(e=>e.kind),['ĆWICZENIE','PODSTAWY']);
});

test('unpublished and invalid-date draft entries are never included',()=>{
 const manual=[{kind:'ĆWICZENIE',href:'/lamiglowki/ex/',title:'Exercise',summary:'Scenario',published:'2026-10-30'}];
 const articles=[{slug:'draft',section:'architektura-w-ruchu',title:'Draft',description:'Not ready'},
  {slug:'wrong',section:'architektura-w-ruchu',title:'Future placeholder',description:'N/A',published:'2026-00-00'}];
 const latest=assembleLatestEdition(manual,articles,url);
 assert.equal(latest.date,'2026-10-30');
 assert.equal(latest.entries.length,1);
});
