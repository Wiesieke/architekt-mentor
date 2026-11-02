import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('PR_READY is never reported before CI + protected Preview + approval recheck',()=>{
 const src=fs.readFileSync(new URL('../scripts/am-desk-publisher.mjs',import.meta.url),'utf8');
 const start=src.indexOf("if(auto && pr.isDraft)gh('pr','ready'");
 const end=src.indexOf("stage='merge'",start);
 assert(start>0 && end>start,'Expected publication gates section missing');
 const block=src.slice(start,end);
 const order=[
  "stage='ci_and_preview'",
  'await waitChecks(pr.number)',
  "stage='approval_recheck'",
  "await workerPost('check'",
  'if(approval.valid!==true)',
  'if(!auto)',
  "status:'PR_READY'"
 ];
 let offset=-1;
 for(const part of order){
  const next=block.indexOf(part);
  assert(next>offset, 'Incorrect publication gate order: '+part);
  offset=next;
 }
 assert(!src.includes("if(!auto){\n      await workerPost('result'"), 'Unsafe early ready status');
});
