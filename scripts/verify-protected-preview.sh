#!/usr/bin/env bash
set -euo pipefail
# Use Vercel CLI's authenticated curl. Do not disable Deployment Protection.
mkdir -p .vercel
printf '{"orgId":"%s","projectId":"%s"}' "$VERCEL_ORG_ID" "$VERCEL_PROJECT_ID" > .vercel/project.json
deployment_url="$(node --input-type=module <<'NODE'
const sha=process.env.COMMIT_SHA;
const token=process.env.VERCEL_TOKEN;
const project=process.env.VERCEL_PROJECT_ID;
if(!sha || !token || !project) throw Error('Missing commit or Vercel credentials');
let url='';
for(let attempt=0;attempt<12;attempt++){
 const response=await fetch('https://api.vercel.com/v6/deployments?projectId='+encodeURIComponent(project)+'&limit=25',{headers:{Authorization:'Bearer '+token}});
 if(!response.ok)throw Error('Vercel deployment lookup returned HTTP '+response.status);
 const data=await response.json();
 const matches=(data.deployments||[]).filter(d=>d.meta?.githubCommitSha===sha && !d.target);
 const deployment=matches[0];
 if(deployment?.state==='ERROR' || deployment?.readyState==='ERROR')throw Error('Preview deployment failed for current commit');
 if(deployment?.state==='READY' || deployment?.readyState==='READY'){url='https://'+deployment.url;break}
 await new Promise(r=>setTimeout(r,10000));
}
if(!url)throw Error('No READY Preview found for the checked commit');
process.stdout.write(url);
NODE
)"
latest_id="$(node -e 'const p=require("./data/puzzles.json").filter(x=>x.coach).sort((a,b)=>b.date.localeCompare(a.date))[0];process.stdout.write(p.id)')"
mkdir -p /tmp/am-preview
paths=("/lamiglowki/$latest_id/" "/en/practice/$latest_id/" "/rss.xml" "/en/rss.xml" "/sitemap.xml")
for i in "${!paths[@]}"; do
  # vercel curl automatically uses the authenticated protection-bypass mechanism.
  # -f makes HTTP 4xx/5xx a hard failure, rather than a green check.
  vercel curl "${paths[$i]}" --deployment "$deployment_url" -- -f -sS -o "/tmp/am-preview/$i"
done
node --input-type=module <<'NODE'
import fs from 'node:fs';
import assert from 'node:assert/strict';
const id=JSON.parse(fs.readFileSync('data/puzzles.json','utf8')).filter(p=>p.coach).sort((a,b)=>b.date.localeCompare(a.date))[0].id;
const bodies=[0,1,2,3,4].map(i=>fs.readFileSync('/tmp/am-preview/'+i,'utf8'));
for (const i of [0,1]) {
 assert(bodies[i].includes(id),'Missing ID from '+(i===0?'PL':'EN')+' practice HTML');
 assert(!/Authentication Required|Log in to Vercel/i.test(bodies[i]),'Protection login was returned instead of HTML');
}
for(const i of [2,3,4]) assert(bodies[i].includes(id),'Missing latest exercise from '+['','','PL RSS','EN RSS','sitemap'][i]);
assert(bodies[0].includes('QuickDecision') || bodies[0].includes('quick-decision') || bodies[0].includes('quick-'),'Missing quick decision markup on PL page');
console.log('Authenticated PL/EN Preview, RSS and sitemap passed.');
NODE
