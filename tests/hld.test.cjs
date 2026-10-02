const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function generate(options={}){
 let request,stored,url;const module={exports:{}};
 vm.runInNewContext(fs.readFileSync('api/generate.js','utf8'),{
  module,process:{env:{OPENAI_API_KEY:'test-only'}},AbortSignal,console:{error(){}},
  require:()=>({storeWithConsent:async record=>{stored=record;return {saved:null};}}),
  fetch:async(endpoint,init)=>{url=endpoint;request=JSON.parse(init.body);return {ok:true,json:async()=>({status:options.status||'completed',output:[{type:'message',content:options.refusal?[{type:'refusal',refusal:'No'}]:[{type:'output_text',text:'# HLD\nA useful draft architecture.'}]}]})};},
 });
 const res={status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
 await module.exports({method:'POST',headers:{},body:{brief:'A public educational booking application.',locale:options.locale||'pl',model:options.model||'gpt-4.1',maxTokens:999999,saveHld:false}},res);
 return {res,request,stored,url};
}
for(const model of ['gpt-4.1','gpt-4.1-mini','gpt-6.1-sol'])for(const locale of ['pl','en'])test(`${model} ${locale}: OpenAI HLD response keeps the public output contract`,async()=>{
 const r=await generate({model,locale});assert.equal(r.res.code,200);assert.match(r.res.data.text,/HLD/);
 assert.equal(r.url,'https://api.openai.com/v1/responses');assert.equal(r.request.model,model);assert.equal(r.request.store,false);
 assert.equal(r.request.max_output_tokens,model==='gpt-4.1-mini'?8000:16000);assert.equal(r.stored.consent,false);
 if(model==='gpt-6.1-sol'){assert.equal(r.request.reasoning.effort,'low');assert.equal(r.request.temperature,undefined);}else assert.equal(r.request.temperature,0.3);
 if(locale==='en')assert.match(r.request.instructions,/Respond entirely in English/);
});
for(const options of [{status:'incomplete'},{refusal:true}])test(`HLD ${JSON.stringify(options)} is never presented or saved as a completed document`,async()=>{
 const r=await generate(options);assert.equal(r.res.code,502);assert.equal(r.stored,undefined);assert.equal(r.res.data.text,undefined);
});
test('an unsupported client model falls back to the allowed OpenAI default',async()=>{
 const r=await generate({model:'claude-sonnet-4-6'});assert.equal(r.request.model,'gpt-4.1');
});
