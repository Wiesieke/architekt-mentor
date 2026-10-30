const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const starters=require('../data/starter-exercises.json');
const puzzles=require('../data/puzzles.json');
const english=require('../data/puzzle-coach-en.json');

test('the starter set has equivalent, anonymised choices, criteria and learning links',()=>{
  assert.ok(starters.length >= 3);
  for(const starter of starters){
    const published=puzzles.find(p=>p.id===starter.id);
    assert.ok(published?.coach);
    assert.deepEqual(published.quick,starter.pl.quick);
    assert.deepEqual(published.coach.criteria,starter.pl.criteria);
    assert.deepEqual(english[starter.id].criteria.map(c=>c.id),starter.en.criteria.map(c=>c.id));
    for(const locale of ['pl','en']){
      const p=starter[locale];
      assert.equal(p.criteria.length,3);
      assert.deepEqual(p.criteria.map(c=>c.id),starter.pl.criteria.map(c=>c.id));
      assert.equal(p.quick.options.length,3);
      assert.equal(new Set(p.quick.options.map(o=>o.id)).size,3);
      assert.ok(p.quick.options.some(o=>o.id===p.quick.correctId));
      assert.ok(p.quick.options.every(o=>o.explanation.length>30));
      assert.ok(fs.existsSync(`src/content/articles/${locale==='en'?'en/':''}${p.learnSlug}.html`));
      assert.match(p.scenario,locale==='pl'?/^(Scenariusz edukacyjny inspirowany praktyką|Fikcyjny scenariusz edukacyjny|Złożony scenariusz edukacyjny)/:/^(Practice-inspired educational scenario|Fictional educational scenario|Composite educational scenario)/);
      assert.doesNotMatch(JSON.stringify(p),/brightstar|euronet|szczegóły zmieniono|TransactionLookup/i);
    }
  }
});

async function assess(starter,locale,stage,invalid=false){
  let stored,request;const logs=[];
  const module={exports:{}};
  const criteria=starter[locale].criteria;
  const feedback=stage==='hint'?{positive:'A reasoned choice',focusId:criteria[0].id,question:'What evidence would you check?'}:{criteria:Object.fromEntries(criteria.map(c=>[c.id,{points:2,reason:'Supported by the stated assumptions'}])),overall:'A sound decision.',nextStep:'Check it with one representative test.'};
  if(invalid===true)feedback.criteria.invented={points:2,reason:'Extra requirement'};
  if(invalid==='missing')delete feedback.criteria[criteria[0].id];
  if(invalid==='points')feedback.criteria[criteria[0].id].points='2';
  vm.runInNewContext(fs.readFileSync('api/evaluate-puzzle.js','utf8'),{
    module,require:path=>path.includes('_store')?{randomUUID:()=> 'ce818959-6952-4c75-93f4-41f3ddf2a222',storeWithConsent:async record=>{stored=record;return {saved:null};}}:path.includes('puzzle-coach-en')?english:puzzles,
    process:{env:{OPENAI_API_KEY:'test-only'}},console:{error:(...items)=>logs.push(items)},AbortSignal,
    fetch:async(url,options)=>{request=JSON.parse(options.body);return {ok:true,json:async()=>({status:invalid==='incomplete'?'incomplete':'completed',output:[{type:'message',content:[{type:invalid==='refusal'?'refusal':'output_text',text:invalid==='json'?'not valid JSON':invalid==='null'?'null':JSON.stringify(feedback)}]}]})};},
  });
  const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
  await module.exports({method:'POST',headers:{},body:{puzzleId:starter.id,locale,stage,answer:'I would check the existing outcome before taking another action.',saveAnswer:false}},res);
  return {res,stored,request,logs};
}
for(const starter of starters)for(const locale of ['pl','en']){
  test(`${starter.id} ${locale}: hint and six-point score respect the three-criterion contract`,async()=>{
    const hint=await assess(starter,locale,'hint');
    assert.equal(hint.res.code,200);assert.ok(hint.res.data.question);assert.equal(hint.res.data.score,undefined);
    const score=await assess(starter,locale,'score');
    assert.deepEqual(score.request.text.format.schema.properties.criteria.required,starter[locale].criteria.map(c=>c.id));
    assert.equal(score.request.text.format.type,'json_schema');assert.equal(score.request.text.format.strict,true);
    assert.equal(score.request.model,'gpt-4.1-mini');assert.equal(score.request.store,false);
    assert.equal(score.res.code,200);assert.equal(score.res.data.maxScore,6);assert.equal(score.res.data.score,6);
    assert.equal(score.stored.consent,false);assert.equal(score.res.data.saved,null);
    assert.ok(starter[locale].criteria.every(c=>score.request.instructions.includes(c.id)));
    assert.match(score.request.instructions,locale==='pl'?/krótkie, sensowne uzasadnienie/:/short sound justification/);
    const invalid=await assess(starter,locale,'score',true);
    assert.equal(invalid.res.code,502);assert.equal(invalid.stored,undefined);
  });
}

for(const invalid of ['missing','points','json','null','incomplete','refusal'])test(`invalid ${invalid} fails closed with metadata-only diagnostics`,async()=>{
  const result=await assess(starters[0],'pl','score',invalid);
  assert.equal(result.res.code,502);assert.equal(result.stored,undefined);
  assert.equal(result.logs.length,1);assert.doesNotMatch(JSON.stringify(result.logs),/existing outcome|Supported by/);
});
const older=puzzles.find(p=>p.coach?.criteria.length===5&&english[p.id]);
test('older five-criterion workshop retains its ten-point score',async()=>{
  assert.ok(older);const item={id:older.id,pl:{criteria:older.coach.criteria},en:{criteria:english[older.id].criteria}};
  for(const locale of ['pl','en']){const result=await assess(item,locale,'score');assert.equal(result.res.code,200);assert.equal(result.res.data.maxScore,10);}
});

test('UNKNOWN practice puzzle offers two modes, three justified options, and an independent failure-detection test in both languages',()=>{
 const id='2026-10-30-unknown-reconciliation';
 const starter=starters.find(x=>x.id===id);
 const puzzle=puzzles.find(x=>x.id===id);
 assert.ok(starter,'Editorial bilingual exercise exists');
 assert.ok(puzzle,'Public PL practice route is registered');
 assert.ok(puzzle.coach && puzzle.quick,'Quick and mentor modes are both present');
 assert.equal(puzzle.quick.options.length,3);
 assert.equal(puzzle.coach.criteria.length,3);
 assert.equal(puzzle.quick.correctId,'c');
 assert.equal(english[id].criteria.length,3);
 assert.deepEqual(english[id].criteria.map(x=>x.id),puzzle.coach.criteria.map(x=>x.id));
 for(const locale of ['pl','en']){
  const x=starter[locale];
  assert.equal(x.quick.options.length,3);
  assert.equal(x.criteria.length,3);
  assert.equal(x.quick.correctId,'c');
  assert.match(x.scenario,locale==='pl'?/Nikt nie musi ponowić/:/No one needs to retry/);
  assert.match(x.analysis,locale==='pl'?/rekoncyliacj/i:/reconciliation/i);
  assert.match(x.analysis,locale==='pl'?/escala|eskalac/i:/escalat/i);
  assert.ok(x.quick.options.every(z=>z.explanation.length>=50),'Every choice has a meaningful explanation');
  assert.ok(fs.existsSync('src/content/articles/'+(locale==='en'?'en/':'')+x.learnSlug+'.html'));
 }
 const old=puzzles.find(x=>x.id==='2026-10-01-nieznany-wynik-transakcji');
 assert.ok(old && old.id!==id && old.coach);
 const plArticle=fs.readFileSync('src/content/articles/'+starter.pl.learnSlug+'.html','utf8');
 const enArticle=fs.readFileSync('src/content/articles/en/'+starter.en.learnSlug+'.html','utf8');
 assert.match(plArticle,/lamiglowki\/2026-10-30-unknown-reconciliation/);
 assert.match(enArticle,/en\/practice\/2026-10-30-unknown-reconciliation/);
});
