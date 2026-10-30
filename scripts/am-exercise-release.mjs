import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Structured PL/EN payload must be approved in the immutable Desk snapshot.
// The publisher never invents options, scores or model answers after approval.
function text(value, label, min=5, max=15000) {
  assert(typeof value === 'string' && value.trim().length >= min
    && value.length <= max, 'Invalid exercise field: ' + label);
  return value.trim();
}
function verifyLocale(raw, locale, expectedCriteria) {
  assert(raw && typeof raw === 'object' && !Array.isArray(raw), 'Missing exercise ' + locale);
  const data = {};
  for(const name of ['title','difficulty','goal','scenario','question','analysis'])
    data[name] = text(raw[name], locale + '.' + name, name === 'analysis' ? 150 : 5);
  assert(!/<\\s*\\/?\\s*[a-z][^>]*>/i.test(data.scenario+' '+data.analysis)\n    && !/\\b(?:javascript|data|vbscript):/i.test(data.scenario+' '+data.analysis),\n    'Unsafe HTML or URL in exercise prose: '+locale);\n  assert(/^(Fikcyjny scenariusz edukacyjny|Scenariusz edukacyjny inspirowany praktyką)/.test(data.scenario)
    || (locale === 'en' && /^(Fictional educational scenario|Practice-inspired educational scenario)/.test(data.scenario)),
    'Missing educational scenario label: ' + locale);
  assert(Array.isArray(raw.hints) && raw.hints.length >= 2 && raw.hints.length <= 6,
    'Invalid hints in ' + locale);
  data.hints = raw.hints.map((item,i)=>text(item, locale + '.hints[' + i + ']', 10, 400));
  const quick = raw.quick;
  assert(quick && Array.isArray(quick.options) && quick.options.length === 3, 'Three options required: ' + locale);
  const options = quick.options.map((option,i)=>({
    id: text(option.id, locale + '.option.id', 1, 12),
    text: text(option.text, locale + '.option.text', 25, 1000),
    explanation: text(option.explanation, locale + '.option.explanation', 35, 1500)
  }));
  assert(new Set(options.map(o=>o.id)).size===3, 'Non-unique option IDs in ' + locale);
  const correctId = text(quick.correctId,locale+'.quick.correctId',1,12);
  assert(options.some(o=>o.id===correctId),'Invalid correctId in ' + locale);
  data.quick = {question:text(quick.question,locale+'.quick.question',15,1000),
    hint:text(quick.hint,locale+'.quick.hint',15,500),correctId,options};
  assert(Array.isArray(raw.criteria) && raw.criteria.length===3,'Three mentor criteria required: ' + locale);
  data.criteria=raw.criteria.map((criterion,i)=>({
    id:text(criterion.id,locale+'.criterion.id',2,60),
    label:text(criterion.label,locale+'.criterion.label',5,150),
    expected:text(criterion.expected,locale+'.criterion.expected',35,800)
  }));
  const ids=data.criteria.map(x=>x.id);
  assert(new Set(ids).size===3,'Duplicate criteria: ' + locale);
  if(expectedCriteria) {
    assert.deepEqual(ids,expectedCriteria.ids, 'PL/EN criteria IDs differ');
    assert.deepEqual(options.map(x=>x.id),expectedCriteria.options, 'PL/EN option IDs differ');
    assert.equal(correctId,expectedCriteria.correctId,'PL/EN best-choice IDs differ');
  }
  return data;
}
export function validateExercisePayload(raw) {
  assert(raw && typeof raw==='object' && !Array.isArray(raw),
    'Puzzle requires an approved structured PL/EN exercise payload');
  const id=text(raw.id,'exercise.id',18,110);
  assert(/^20\d\d-\d\d-\d\d-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id),
    'Invalid exercise permalink ID');
  const pl=verifyLocale(raw.pl,'pl');
  const expectedCriteria={ids:pl.criteria.map(x=>x.id),
    options:pl.quick.options.map(o=>o.id),correctId:pl.quick.correctId};
  const en=verifyLocale(raw.en,'en',expectedCriteria);
  return {id,pl,en};
}
function jsonFile(root,relative,fn) {
  const p=path.join(root,relative);
  const before=JSON.parse(fs.readFileSync(p,'utf8'));
  return {path:p,content:JSON.stringify(fn(before),null,2)+'\n'};
}
export function makeExerciseReleaseFiles(root, parsed, date) {
  const item=parsed.exercise;
  assert(item && parsed.sections[0]==='podstawy-architektury',
    'Exercise requires a linked Foundations article');
  const id=item.id;
  const startersFile=jsonFile(root,'data/starter-exercises.json',items=>{
    assert(Array.isArray(items)&&!items.some(p=>p.id===id),'Duplicate starter exercise: '+id);
    return [{id,pl:{...item.pl,learnSlug:parsed.slugPl},en:{...item.en,learnSlug:parsed.slugEn}},...items];
  });
  const related=[{type:'PODSTAWY',title:parsed.texts.pl.title,
    description:'Przeczytaj pełne omówienie i granice rozwiązania',
    href:'/podstawy-architektury/'+parsed.slugPl+'/'}];
  const puzzle={
    id,week:'Z PRAKTYKI ARCHITEKTA · 2 TRYBY',date,
    title:item.pl.title,difficulty:item.pl.difficulty,goal:item.pl.goal,
    scenario:item.pl.scenario,question:item.pl.question,hints:item.pl.hints,
    analysis:item.pl.analysis,quick:item.pl.quick,coach:{criteria:item.pl.criteria},related
  };
  const puzzleFile=jsonFile(root,'data/puzzles.json',items=>{
    assert(Array.isArray(items)&&!items.some(p=>p.id===id),'Duplicate puzzle: '+id);
    return [puzzle,...items];
  });
  const coachFile=jsonFile(root,'data/puzzle-coach-en.json',items=>{
    assert(items && !items[id], 'Duplicate English mentor: '+id);
    return {[id]:{scenario:item.en.scenario,question:item.en.question,criteria:item.en.criteria},...items};
  });
  const cataloguePath=path.join(root,'src/data/catalogue.ts');
  const catalogue=fs.readFileSync(cataloguePath,'utf8');
  const marker='const assignments: Record<string,string> = {\n';
  assert(catalogue.includes(marker) && !catalogue.includes("'"+id+"':"),'Cannot register exercise catalogue');
  const group={integration:'integration',resilience:'resilience',security:'security',
    analysis:'decisions',quality:'decisions',description:'decisions'}[parsed.learningGroup];
  assert(group,'Cannot map Foundations group to exercise area');
  const catalogueFile={path:cataloguePath,content:catalogue.replace(marker,marker+
    " '"+id+"':'"+group+"',\n")};
  const editionsPath=path.join(root,'src/data/editions.ts');
  const editions=fs.readFileSync(editionsPath,'utf8');
  const editionMarker='export const editions = [\n';
  assert(editions.includes(editionMarker)&&!editions.includes('/lamiglowki/'+id+'/'),
    'Cannot register exercise in editions');
  const listing="  { kind:'ĆWICZENIE', title:"+JSON.stringify(item.pl.title)+
    ", summary:'Średni · szybka decyzja i warsztat z mentorem', href:'/lamiglowki/"+
    id+"/', published:"+JSON.stringify(date)+" },\n";
  const editionFile={path:editionsPath,content:editions.replace(editionMarker,editionMarker+listing)};
  return [startersFile,puzzleFile,coachFile,catalogueFile,editionFile];
}
