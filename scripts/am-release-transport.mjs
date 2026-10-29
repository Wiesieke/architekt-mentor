import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ENDPOINT = 'https://mentor-api.sensinte.com/architect-desk/release-worker.php';

export function assertTrustedRunner() {
  assert.equal(process.env.GITHUB_REPOSITORY, 'Wiesieke/architekt-mentor',
    'Worker may only run in the ArchitectMentor public site repository');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main',
    'Worker may only run from the reviewed main branch');
}
export function jobFile() {
  const temp = process.env.RUNNER_TEMP;
  assert(typeof temp === 'string' && temp.length > 3, 'RUNNER_TEMP missing');
  return path.join(temp, 'architectmentor-release-job.json');
}
export async function workerPost(action, body) {
  assert(['claim','check','result'].includes(action), 'Unsupported release action');
  const secret = process.env.AM_RELEASE_WORKER_TOKEN;
  assert(typeof secret === 'string' && secret.length >= 32, 'Worker token not configured');
  const response = await fetch(ENDPOINT + '?action=' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-AM-Release-Token': secret },
    body: JSON.stringify(body),
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error('Desk release API HTTP ' + response.status + ' (' + action + ')');
  const json = await response.json();
  if (json?.ok !== true) throw new Error('Desk release API result invalid (' + action + ')');
  return json;
}
async function claim() {
  assertTrustedRunner();
  if (process.env.AM_RELEASE_ENABLED !== '1') {
    console.log('ArchitectMentor release worker is disabled.');
    return;
  }
  const result = await workerPost('claim', {});
  const job = result.job;
  if (!job) {
    console.log('No pending release; no build required.');
    return;
  }
  assert(Number.isSafeInteger(job.job_id) && job.job_id > 0, 'Desk job id invalid');
  fs.writeFileSync(jobFile(), JSON.stringify(job), {mode:0o600, flag:'wx'});
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, 'has_job=true\n');
  console.log('Release job claimed. Input stored outside the repository; preparing CI.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  if (process.argv[2] !== '--claim') throw new Error('Use --claim');
  await claim();
}
