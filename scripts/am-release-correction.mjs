import assert from 'node:assert/strict';

// Pure, testable guard. A withdrawn release must be the exact unmerged
// publication PR whose branch was derived from the approved Desk snapshot.
export function assertCorrectionCandidate(parsed, pr) {
 assert(parsed && typeof parsed.branch==='string'
   && /^release\/[a-z0-9-]+-r[1-9][0-9]*$/.test(parsed.branch),
   'Invalid approved release branch');
 assert(pr && pr.headRefName===parsed.branch, 'Correction head branch mismatch');
 assert(pr.baseRefName==='main', 'Correction base branch mismatch');
 assert(typeof pr.url==='string' && /^https:\/\/github\.com\/Wiesieke\/architekt-mentor\/pull\/[1-9][0-9]*$/.test(pr.url),
   'Correction PR URL invalid');
 assert(pr.mergedAt===null, 'Merged publication cannot be withdrawn');
 assert(pr.state==='OPEN'||pr.state==='CLOSED', 'Unexpected release state');
}

export function assertCorrectionCompleted(pr) {
 assert(pr && pr.state==='CLOSED' && pr.mergedAt===null,
   'Original PR must be CLOSED, not MERGED, before the Desk can reopen its approved revision');
}
