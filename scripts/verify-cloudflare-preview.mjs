import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const project = 'architekt-mentor';
const accessHost = 'architekt-mentor-pages.cloudflareaccess.com';

export function selectPreview(deployments, sha) {
  return deployments.find(item => {
    const trigger = item.deployment_trigger;
    const stage = item.latest_stage;
    return item.environment === 'preview'
      && item.project_name === project
      && item.is_skipped !== true
      && trigger?.type === 'github:push'
      && trigger.metadata?.commit_hash === sha
      && trigger.metadata?.commit_dirty !== true
      && stage?.name === 'deploy' && stage.status === 'success';
  });
}

export function previewOrigin(deployment) {
  assert.match(deployment.short_id, /^[a-f0-9]{8}$/, 'Invalid Pages deployment ID');
  const expected = 'https://' + deployment.short_id + '.' + project + '.pages.dev';
  const url = new URL(deployment.url);
  assert.equal(url.href, expected + '/', 'Unexpected Pages deployment URL');
  return expected;
}

function accessBlocked(response) {
  if ([401, 403].includes(response.status)) return true;
  if (![301, 302, 303, 307, 308].includes(response.status)) return false;
  const location = response.headers.get('location');
  if (!location) return false;
  const redirect = new URL(location, 'https://' + accessHost);
  return location.startsWith('https://') && redirect.origin === 'https://' + accessHost;
}

async function request(url, headers, fetcher) {
  return fetcher(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(12000) });
}

export async function fetchProtectedRoutes(origin, routes, credentials, fetcher = fetch) {
  const accessHeaders = {
    'CF-Access-Client-Id': credentials.clientId,
    'CF-Access-Client-Secret': credentials.clientSecret
  };
  return Promise.all(routes.map(async route => {
    assert.match(route, /^\/[a-zA-Z0-9/_\-.]+$/, 'Unexpected Preview route');
    assert(!route.startsWith('//') && !route.split('/').includes('..'), 'Unsafe Preview route');
    const url = origin + route;
    const anonymous = await request(url, {}, fetcher);
    assert(accessBlocked(anonymous), 'Cloudflare Access did not block anonymous request: ' + route);
    await anonymous.body?.cancel();
    const authorized = await request(url, accessHeaders, fetcher);
    assert.equal(authorized.status, 200, 'Authenticated Preview did not return HTTP 200: ' + route);
    return authorized.text();
  }));
}

export function verifyPreviewBodies(id, bodies) {
  const [plHome, enHome, plPractice, enPractice, plRss, enRss, sitemap] = bodies;
  for (const html of [plHome, enHome, plPractice, enPractice]) {
    assert(html.length > 1500 && /<html\b/i.test(html), 'Missing rendered Preview HTML');
  }
  for (const html of [plPractice, enPractice]) {
    assert(html.includes(id), 'Missing expected exercise on protected Preview');
    assert(/quick-decision|quick-/i.test(html), 'Missing quick decision markup');
  }
  for (const feed of [plRss, enRss]) {
    assert(/<rss\b/i.test(feed) && feed.includes(id), 'Latest exercise absent from Preview RSS');
  }
  assert(/<urlset\b/i.test(sitemap), 'Invalid Preview sitemap');
  assert(!/<loc(?:\s|>)/i.test(sitemap), 'Preview sitemap exposes indexed routes');
}

export async function verifyCloudflarePreview(env = process.env) {
  assert.match(env.COMMIT_SHA ?? '', /^[a-f0-9]{40}$/, 'Invalid expected PR SHA');
  assert.match(env.CLOUDFLARE_ACCOUNT_ID ?? '', /^[a-f0-9]{32}$/, 'Missing or invalid Actions variable CLOUDFLARE_ACCOUNT_ID');
  for (const key of ['CLOUDFLARE_PAGES_READ_TOKEN', 'CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET']) {
    assert(env[key], 'Missing Actions secret ' + key);
  }

  const api = 'https://api.cloudflare.com/client/v4/accounts/' + env.CLOUDFLARE_ACCOUNT_ID
    + '/pages/projects/' + project + '/deployments?env=preview&per_page=25';
  let deployment;
  for (let attempt = 0; attempt < 24 && !deployment; attempt++) {
    const response = await request(api, { Authorization: 'Bearer ' + env.CLOUDFLARE_PAGES_READ_TOKEN }, fetch);
    assert.equal(response.status, 200, 'Pages deployment lookup did not return HTTP 200');
    const data = await response.json();
    assert(data.success === true && Array.isArray(data.result), 'Invalid Pages deployment lookup response');
    deployment = selectPreview(data.result, env.COMMIT_SHA);
    if (!deployment && attempt < 23) await delay(10000);
  }
  assert(deployment, 'No successful Cloudflare Pages Preview for exact PR SHA ' + env.COMMIT_SHA);
  const origin = previewOrigin(deployment);
  const puzzles = JSON.parse(await readFile('data/puzzles.json', 'utf8'));
  const id = puzzles.filter(item => item.coach).sort((a, b) => b.date.localeCompare(a.date))[0]?.id;
  assert.match(id ?? '', /^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Missing or invalid latest exercise ID');
  const routes = ['/pl/', '/en/', '/lamiglowki/' + id + '/', '/en/practice/' + id + '/',
    '/rss.xml', '/en/rss.xml', '/sitemap.xml'];
  const bodies = await fetchProtectedRoutes(origin, routes, {
    clientId: env.CF_ACCESS_CLIENT_ID, clientSecret: env.CF_ACCESS_CLIENT_SECRET
  });
  verifyPreviewBodies(id, bodies);
  console.log('Protected Cloudflare Pages Preview passed for ' + env.COMMIT_SHA + ' at ' + origin);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await verifyCloudflarePreview();
}
