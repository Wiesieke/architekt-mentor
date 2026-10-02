const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
async function generate(options={}){
 let request,stored,url,timeoutMs;const module={exports:{}};
 vm.runInNewContext(fs.readFileSync('api/generate.js','utf8'),{
  module,process:{env:{OPENAI_API_KEY:'test-only'}},AbortSignal:{timeout(ms){timeoutMs=ms;return AbortSignal.timeout(ms);}},console:{error(){},info(){}},
  require:()=>({storeWithConsent:async record=>{stored=record;return {saved:null};}}),
  fetch:async(endpoint,init)=>{if(options.timeout){const e=new Error("Timeout");e.name="TimeoutError";throw e;}url=endpoint;request=JSON.parse(init.body);return {ok:true,json:async()=>({status:options.status||'completed',incomplete_details:options.reason?{reason:options.reason}:undefined,output:[{type:'message',content:options.refusal?[{type:'refusal',refusal:'No'}]:[{type:'output_text',text:'# HLD\nA useful draft architecture.'}]}]})};},
 });
 const res={status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
 await module.exports({method:'POST',headers:{},body:{brief:'A public educational booking application.',locale:options.locale||'pl',model:options.model||'gpt-4.1',mode:options.mode||'skeletal',maxTokens:999999,saveHld:false}},res);
 return {res,request,stored,url,timeoutMs};
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

test('full Sol HLD has time to finish within the deployed function budget',async()=>{
 const r=await generate({model:'gpt-6.1-sol',mode:'full'});
 assert.equal(r.res.code,200);assert.match(r.request.input,/MODE: full/);
 assert.equal(r.timeoutMs,270000);
 const seconds=JSON.parse(fs.readFileSync('vercel.json','utf8')).functions['api/generate.js'].maxDuration;
 assert.equal(seconds,300);assert.ok(seconds*1000-r.timeoutMs>=30000);
});
test('provider timeout is explicit and never stores an unfinished HLD',async()=>{
 for(const locale of ['pl','en']){const r=await generate({timeout:true,locale,mode:'full',model:'gpt-6.1-sol'});
 assert.equal(r.res.code,504);assert.equal(r.res.data.code,'generation_timeout');assert.equal(r.stored,undefined);
 assert.match(r.res.data.error,locale==='en'?/time limit/:/limit czasu/);}
});

test('a full HLD truncated by its output budget requests a larger limit and is never stored',async()=>{
 const r=await generate({status:'incomplete',reason:'max_output_tokens',mode:'full'});
 assert.equal(r.res.code,502);assert.equal(r.res.data.code,'output_token_limit');assert.match(r.res.data.error,/Zwiększ limit/);assert.equal(r.stored,undefined);
});
