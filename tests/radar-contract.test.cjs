'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=(p)=>fs.readFileSync(path.join(root,p),'utf8');
test('ArchitectMentor Radar SQL is isolated and carries human-only decisions',()=>{
 const sql=load('radar/db/001_architectmentor_radar.sql');
 for(const table of ['amr_sources','amr_items','amr_decisions','amr_ingest_runs','amr_cycles'])assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
 for(const state of ['UNREVIEWED','SELECTED','HOLD','REJECTED','REQUEST_RESEARCH'])assert.ok(sql.includes(state));
 assert.doesNotMatch(sql,/CREATE TABLE IF NOT EXISTS nr_/);
});
test('hourly collector is private CLI with off switch, rights gate, locking and metrics',()=>{
 const worker=load('radar/lh/private/hourly.php');
 assert.match(worker,/PHP_SAPI!=='cli'/);
 assert.match(worker,/AM_RADAR_WORKER_ENABLED/);
 assert.match(worker,/enabled=1 AND rights_gate='approved'/);
 assert.match(worker,/GET_LOCK/);
 assert.match(worker,/amr_cycles/);
 assert.doesNotMatch(worker,/publish|sendMail|newsletter|deployHook/i);
});
test('catalog seeds disabled sources and never fetches other brands data',()=>{
 const radar=load('radar/lh/private/radar.php');
 assert.match(radar,/stripos\(\$name,'wrycut'\)/);
 assert.match(radar,/needs_review',0/);
 assert.match(radar,/CURLOPT_FOLLOWLOCATION=>false/);
 assert.match(radar,/LIBXML_NONET/);
 assert.doesNotMatch(radar,/WRYCUT_RADAR_/);
});
