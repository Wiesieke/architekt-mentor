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

test('automatic rollout never imports historical PR_READY releases',()=>{
 const transport=fs.readFileSync(new URL('../scripts/am-release-transport.mjs',import.meta.url),'utf8');
 assert(transport.includes('allow_pr_ready: false'),
  'Switching on auto-merge must not sweep old PR_READY jobs');
 assert(!transport.includes("allow_pr_ready: process.env.AM_RELEASE_AUTO_MERGE"),
  'Do not regress to historical queue sweep');
});

test('merge is restricted to the immutable head commit that passed required gates',()=>{
 const src=fs.readFileSync(new URL('../scripts/am-desk-publisher.mjs',import.meta.url),'utf8');
 assert(src.includes('headRefOid'),'Release must fetch PR head SHA');
 assert(src.includes('const verifiedHead=await waitChecks(pr.number)'),
  'Quality and Preview gates must return the verified PR head SHA');
 assert(src.includes("gh('pr','merge',String(pr.number),'--squash','--match-head-commit',verifiedHead)"),
  'Squash merge must fail closed if PR head changes after CI');
 assert(!src.includes("'--admin'"),'Publisher must never bypass branch policies');
});
