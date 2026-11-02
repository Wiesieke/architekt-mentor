import test from 'node:test';
import assert from 'node:assert/strict';
import { assertCorrectionCandidate, assertCorrectionCompleted } from '../scripts/am-release-correction.mjs';
const parsed={branch:'release/am-rss-abc-r2'};
const good={headRefName:parsed.branch,baseRefName:'main',
 url:'https://github.com/Wiesieke/architekt-mentor/pull/85',state:'OPEN',mergedAt:null};

test('only the exact open, unmerged approved PR can be withdrawn',()=>{
 assert.doesNotThrow(()=>assertCorrectionCandidate(parsed,good));
 assert.throws(()=>assertCorrectionCandidate(parsed,{...good,headRefName:'release/other-r2'}),/branch mismatch/);
 assert.throws(()=>assertCorrectionCandidate(parsed,{...good,baseRefName:'other'}),/base branch/);
 assert.throws(()=>assertCorrectionCandidate(parsed,{...good,url:'https://github.com/other/repo/pull/85'}),/URL invalid/);
 assert.throws(()=>assertCorrectionCandidate(parsed,{...good,mergedAt:'2026-11-02T10:00:00Z'}),/Merged/);
 assert.throws(()=>assertCorrectionCandidate(parsed,{...good,state:'MERGED'}),/Unexpected/);
});
test('confirm the old PR was closed before authorizing a new approved revision',()=>{
 assert.doesNotThrow(()=>assertCorrectionCompleted({...good,state:'CLOSED'}));
 assert.throws(()=>assertCorrectionCompleted(good),/CLOSED/);
 assert.throws(()=>assertCorrectionCompleted({...good,state:'CLOSED',mergedAt:'2026-11-02T10:00:00Z'}),/CLOSED/);
});
