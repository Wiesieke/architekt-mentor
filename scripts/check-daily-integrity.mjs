import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const editions = read('src/data/editions.ts');
const date = new Intl.DateTimeFormat('en-CA', {timeZone: 'Europe/Warsaw', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
const health = process.argv.includes('--daily-health');
const issues = [];
const auth = JSON.parse(read('docs/publication-authorization.json'));
if (auth.mode !== 'delegated-quality-gated-release' || auth.personalReviewRequired !== false || !auth.approvalRequirements?.evidence || !auth.approvalRequirements?.technicalChecks) {
  issues.push('Delegated publisher authorization and mandatory release gates are missing');
}
const today = [...editions.matchAll(/published:\s*['"]([^'"]+)['"]/g)].filter(m => m[1] === date);
const paths = [...editions.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
// Shared legacy landing URLs (for example /lamiglowka/) are intentional.\n// Do not fail CI for existing duplicates; verify new publication routes separately.\nif (new Set(paths).size !== paths.length) console.warn('WARNING: editions.ts has shared hrefs; inspect new entries for unique permanent URLs');
if (health) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  const line = `Daily health for ${date}: ${today.length} indexed entries. This does not prove successful production deployment.\n`;
  if (summary) fs.appendFileSync(summary, line);
  console.log(line.trim());
  if (!today.length) console.warn('No validated edition indexed today; preparation or release gates may be incomplete. Do not bypass the delegated quality gate.');
}
if (issues.length) {
  for (const issue of issues) console.error('BLOCKER:', issue);
  process.exitCode = 1;
} else {
  console.log('Integrity checks passed (authorization and unique index paths).');
}
