import test from 'node:test';
import assert from 'node:assert/strict';
import {audit, validateExtraction} from '../src/lib/auditor/core.mjs';
import {extractWithOpenAI} from '../src/lib/auditor/openai-extractor.mjs';

const docs = [
  {id:'HLD', text:'Przepływ płatności. Komunikat może zostać dostarczony wielokrotnie i będzie ponawiany po awarii.'},
  {id:'ADR', text:'Przepływ płatności. Każda operacja musi mieć jednokrotny efekt biznesowy.'}
];
const base = {
  flows:[{id:'payments', name:'Przepływ płatności',documentId:'HLD',quote:'Przepływ płatności.'}],
  claims:[
    {id:'c1',flowId:'payments',kind:'possible_duplicate_delivery',documentId:'HLD',quote:'Komunikat może zostać dostarczony wielokrotnie'},
    {id:'c2',flowId:'payments',kind:'exactly_once_requirement',documentId:'ADR',quote:'Każda operacja musi mieć jednokrotny efekt biznesowy.'}
  ]
};
test('cross-document risk is NEEDS_REVIEW and cites both sources',()=>{
  const result = audit(docs,base);
  assert.equal(result.findings[0].status,'NEEDS_REVIEW');
  assert.equal(result.findings[0].evidence.length,2);
  assert.equal(result.graph.nodes.length,5);
});
test('explicit mechanism is a documentary PASS, not implementation proof',()=>{
  const extended = [...docs,{id:'ADR2',text:'W przepływie płatności stosujemy klucze idempotentności dla każdej operacji.'}];
  const claims = [...base.claims,{id:'c3',flowId:'payments',kind:'protection_documented',documentId:'ADR2',quote:'stosujemy klucze idempotentności'}];
  assert.equal(audit(extended,{...base,claims}).findings[0].status,'PASS');
});
test('invalid source quote fails closed',()=>{
  const claims = [{...base.claims[0],quote:'Zmyślona treść'}];
  assert.throws(()=>validateExtraction(docs,{...base,claims}),/unverified claim evidence/);
});
test('does not mix different flows when evaluating a rule',()=>{
  const extraction = {...base,flows:[...base.flows,{id:'reporting',name:'Raportowanie',documentId:'ADR',quote:'Przepływ płatności.'}],claims:[
    base.claims[0], {...base.claims[1],flowId:'reporting'}
  ]};
  const findings = audit(docs,extraction).findings;
  assert.equal(findings.length,2);
  assert.ok(findings.every(f=>f.status!=='NEEDS_REVIEW'));
});
test('live adapter has store disabled and validates a mocked JSON response',async()=>{
  let request;
  const fakeFetch=async (_url,opts)=>{
    request=JSON.parse(opts.body);
    return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(base)}]}]})};
  };
  const parsed = await extractWithOpenAI(docs,{apiKey:'test-key',fetchImpl:fakeFetch});
  assert.equal(parsed.claims.length,2);
  assert.equal(request.store,false);
  assert.equal(request.text.format.type,'json_schema');
});
