import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml, makeReleaseFiles, parseApprovedJob, verifyBuiltRelease, writeReleaseFiles } from './am-release-lib.mjs';
import { assertTrustedRunner, jobFile, workerPost } from './am-release-transport.mjs';

const REPOSITORY='Wiesieke/architekt-mentor';
const root=process.cwd();
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function run(command,args,timeout=900000) {
  return execFileSync(command,args,{
    cwd:root,env:process.env,encoding:'utf8',stdio:['ignore','pipe','pipe'],
    timeout,maxBuffer:3*1024*1024
  }).trim();
}
function gh(...args) {
  return run('gh',[...args,'--repo',REPOSITORY]);
}
function prView(number) {
  return JSON.parse(gh('pr','view',String(number),
    '--json','number,url,state,mergedAt,mergeCommit,baseRefName,isDraft,statusCheckRollup'));
}
function findExistingPR(branch) {
  const list=JSON.parse(gh('pr','list','--head',branch,'--state','all',
    '--json','number,url,state,isDraft,mergedAt','--limit','20'));
  if(!Array.isArray(list)||list.length===0)return null;
  assert(list.length===1, 'Duplicate release branch PRs require a manual review');
  return list[0];
}
function urlOk(value,origin,pathPrefix) {
  if(typeof value!=='string')return false;
  try{
    const url=new URL(value);
    return url.origin===origin && url.pathname.startsWith(pathPrefix)
      && !url.username && !url.password;
  }catch{return false;}
}
async function waitChecks(number) {
  const required=['editorial-quality','protected-preview','Build PL/EN and test comments'];
  for(let attempt=0;attempt<65;attempt++){
    const pr=prView(number);
    const checks=Array.isArray(pr.statusCheckRollup)?pr.statusCheckRollup:[];
    const status=name=>checks.find(c=>c.name===name||c.context===name);
    const found=required.map(status);
    const failed=found.some(c=>c&&['FAILURE','CANCELLED','TIMED_OUT','ACTION_REQUIRED','NEUTRAL','SKIPPED'].includes(
      String(c.conclusion??c.state??'').toUpperCase()));
    if(failed)throw new Error('Mandatory PR quality or Vercel Preview check failed');
    const passed=found.every(c=>c&&['SUCCESS'].includes(
      String(c.conclusion??c.state??'').toUpperCase()));
    if(passed){
      if(pr.state!=='OPEN'||pr.baseRefName!=='main')throw new Error('Release PR target changed');
      return;
    }
    await pause(15000);
  }
  throw new Error('Quality checks did not complete within the allotted time');
}
async function pageMatches(url,title) {
  try{
    const response=await fetch(url,{cache:'no-store',redirect:'follow',signal:AbortSignal.timeout(9000)});
    if(!response.ok||new URL(response.url).hostname!=='ejsymont.com')return false;
    const html=await response.text();
    return html.length>2000 && html.includes(escapeHtml(title));
  }catch{return false;}
}
async function feedHas(url,slug) {
  try{
    const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(9000)});
    return response.ok && (await response.text()).includes(slug);
  }catch{return false;}
}
async function waitProduction(parsed) {
  for(let i=0;i<72;i++){
    const results=await Promise.all([
      pageMatches(parsed.urls.pl,parsed.texts.pl.title),
      pageMatches(parsed.urls.en,parsed.texts.en.title),
      feedHas('https://ejsymont.com/rss.xml',parsed.slugPl),
      feedHas('https://ejsymont.com/en/rss.xml',parsed.slugEn),
      feedHas('https://ejsymont.com/sitemap.xml',parsed.slugPl),
      feedHas('https://ejsymont.com/sitemap.xml',parsed.slugEn)
    ]);
    if(results.every(Boolean))return;
    await pause(10000);
  }
  throw new Error('Production URLs, RSS or sitemap not yet verified');
}
function prepareBranch(parsed) {
  if(fs.existsSync(path.join(root,'src/content/articles',parsed.slugPl+'.html')))
    throw new Error('Article already deployed; a separate correction flow is required');
  const files=makeReleaseFiles(root,parsed,new Date().toISOString().slice(0,10));
  run('git',['checkout','-b',parsed.branch]);
  writeReleaseFiles(files);
  run('npm',['run','test:comments']);
  run('node',['--test','tests/am-release-lib.test.mjs']);
  run('npm',['run','build']);
  run('node',['scripts/check-editorial-publishing.mjs']);
  verifyBuiltRelease(root,parsed);
  run('git',['config','user.name','ArchitectMentor Release Bot']);
  run('git',['config','user.email','release-bot@users.noreply.github.com']);
  run('git',['add',...files.map(f=>path.relative(root,f.path))]);
  run('git',['commit','-m','publish: approved ArchitectMentor '+parsed.h.candidate_id+
    ' revision '+parsed.h.approved_revision]);
  run('git',['push','-u','origin',parsed.branch],90000);
}
function createPR(parsed,auto) {
  const title='ArchitectMentor: '+parsed.texts.pl.title.replace(/\s+/g,' ').slice(0,175);
  const body=[
    '## Wydanie z ArchitectMentor Desk',
    '- Kandydat: '+parsed.h.candidate_id,
    '- Zatwierdzona rewizja: '+parsed.h.approved_revision,
    '- Zatwierdził: '+parsed.h.approval.by+' · '+parsed.h.approval.at_utc+' UTC',
    '- Wyraźne zlecenie: '+parsed.h.release.requested_by+' · '+parsed.h.release.requested_at_utc+' UTC',
    '- Źródło pierwotne: '+parsed.h.source.url,
    '- Sekcja: '+parsed.category,
    '',
    '## Warunki wydania',
    '- Zlecenie jest niezmiennym snapshotem; brak zgody na zmianę treści po akceptacji.',
    '- Wymagane zielone kontrole PL/EN, źródeł, CI, podglądu i RSS/sitemap.',
    '- PR jest generowany automatycznie; merge nie może omijać reguł gałęzi.',
    '- Produkcja jest potwierdzana po rzeczywistym wdrożeniu na ejsymont.com.'
  ].join('\n');
  const args=['pr','create','--base','main','--head',parsed.branch,'--title',title,'--body',body];
  if(!auto)args.push('--draft');
  const url=gh(...args).split('\n').pop().trim();
  assert(urlOk(url,'https://github.com','/Wiesieke/architekt-mentor/pull/'),
    'Unexpected PR target');
  return url;
}
async function main() {
  assertTrustedRunner();
  assert.equal(process.env.AM_RELEASE_ENABLED,'1','Publication worker is disabled');
  assert(typeof process.env.GH_TOKEN==='string'&&process.env.GH_TOKEN.length>20,
    'Scoped GitHub publishing token missing');
  const job=JSON.parse(fs.readFileSync(jobFile(),'utf8'));
  let pr=null,parsed=null,publishedSha=null,stage='validate';
  try {
    parsed=parseApprovedJob(job);
    const auto=process.env.AM_RELEASE_AUTO_MERGE==='1';
    stage='existing_pr_lookup';
    pr=findExistingPR(parsed.branch);
    if(!pr){
      stage='build_validation';
      prepareBranch(parsed);
      stage='create_pr';
      const url=createPR(parsed,auto);
      pr=findExistingPR(parsed.branch);
      assert(pr&&pr.url===url,'New PR not found');
    }
    assert(urlOk(pr.url,'https://github.com','/Wiesieke/architekt-mentor/pull/'),
      'Unexpected existing PR URL');
    if(pr.state==='CLOSED')throw new Error('Closed release PR requires manual review');
    if(pr.state==='MERGED'){
      stage='verify_production';
      await waitProduction(parsed);
      const v=prView(pr.number);
      const sha=v.mergeCommit?.oid;
      assert(/^[a-f0-9]{40}$/.test(sha??''),'Merged commit SHA unavailable');
      publishedSha=sha;
      await workerPost('result',{job_id:job.job_id,content_sha256:job.content_sha256,
        status:'PUBLISHED',pr_url:pr.url,published_sha:sha,
        published_url_pl:parsed.urls.pl,published_url_en:parsed.urls.en});
      console.log('Already-merged approved release verified and reported.');
      return;
    }
    if(!auto){
      await workerPost('result',{job_id:job.job_id,content_sha256:job.content_sha256,
        status:'PR_READY',pr_url:pr.url});
      console.log('Approved article PR created; automatic merge is OFF.');
      return;
    }
    if(pr.isDraft)gh('pr','ready',String(pr.number));
    stage='ci_and_preview';
    await waitChecks(pr.number);
    stage='approval_recheck';
    const approval=await workerPost('check',{job_id:job.job_id,content_sha256:job.content_sha256});
    if(approval.valid!==true)throw new Error('Approved revision or job state changed');
    stage='merge';
    gh('pr','merge',String(pr.number),'--squash');
    const merged=prView(pr.number);
    assert(merged.state==='MERGED','PR not merged');
    const sha=merged.mergeCommit?.oid;
    assert(/^[a-f0-9]{40}$/.test(sha??''),'Merge commit SHA missing');
    publishedSha=sha;
    stage='verify_production';
    await waitProduction(parsed);
    stage='report_published';
    await workerPost('result',{job_id:job.job_id,content_sha256:job.content_sha256,
      status:'PUBLISHED',pr_url:pr.url,published_sha:sha,
      published_url_pl:parsed.urls.pl,published_url_en:parsed.urls.en});
    console.log('Release completed; both public language routes and feeds verified.');
  } catch(error) {
    const errorCode=stage.replace(/[^a-z0-9_]/g,'_').slice(0,100)+'_failed';
    console.error('ArchitectMentor release stopped at stage: '+stage);
    try{
      // A merged PR is irreversible. Preserve this fact and retry deployment verification.
      // Never report PR_READY or FAILED as if the production merge had not happened.
      let merged=false;
      if(pr){
        try{
          const latest=prView(pr.number);
          merged=latest.state==='MERGED';
          if(merged)publishedSha=latest.mergeCommit?.oid??publishedSha;
        }catch{console.error('Cannot check PR state; Desk lease will recover.');throw error;}
      }
      if(merged){
        assert(parsed&&/^[a-f0-9]{40}$/.test(publishedSha??''),
          'Merged release evidence is incomplete');
        await workerPost('result',{job_id:job.job_id,content_sha256:job.content_sha256,
          status:'VERIFY_PENDING',pr_url:pr.url,published_sha:publishedSha,
          published_url_pl:parsed.urls.pl,published_url_en:parsed.urls.en,
          error_code:'production_verification_pending'});
        console.error('Merge complete; production verification queued for retry.');
      }else{
        await workerPost('result',{job_id:job.job_id,content_sha256:job.content_sha256,
          status:pr?'BLOCKED':'FAILED',pr_url:pr?.url??'',error_code:errorCode});
      }
    }catch{console.error('Desk callback unavailable; leased job will be recovered.');}
    throw error;
  }
}
await main();
