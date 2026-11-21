import test from 'node:test';
import assert from 'node:assert/strict';
import { selectPreview, previewOrigin, fetchProtectedRoutes, verifyPreviewBodies } from '../scripts/verify-cloudflare-preview.mjs';

const sha = 'a'.repeat(40);
const origin = 'https://a1b2c3d4.architekt-mentor.pages.dev';
const deployment = {
  url: origin, short_id: 'a1b2c3d4', project_name: 'architekt-mentor', environment: 'preview',
  deployment_trigger: { type: 'github:push', metadata: { commit_hash: sha } },
  latest_stage: { name: 'deploy', status: 'success' }
};

test('requires a clean, successfully deployed Preview from the exact Git commit', () => {
  assert.equal(selectPreview([deployment], sha), deployment);
  assert.equal(selectPreview([deployment], 'b'.repeat(40)), undefined);
  assert.equal(selectPreview([{ ...deployment, environment: 'production' }], sha), undefined);
  assert.equal(selectPreview([{ ...deployment, latest_stage: { name: 'build', status: 'success' } }], sha), undefined);
  const dirty = { ...deployment, deployment_trigger: {
    type: 'github:push', metadata: { commit_hash: sha, commit_dirty: true }
  } };
  assert.equal(selectPreview([dirty], sha), undefined);
  assert.equal(previewOrigin(deployment), origin);
  assert.throws(() => previewOrigin({ ...deployment, url: 'https://branch.architekt-mentor.pages.dev' }), /Unexpected/);
  assert.throws(() => previewOrigin({ ...deployment, url: origin + '@example.com' }), /Unexpected/);
});

test('requires anonymous protection and authenticated content without following redirects', async () => {
  const credentials = { clientId: 'test-id', clientSecret: 'test-secret' };
  const calls = [];
  const accessUrl = 'https://architekt-mentor-pages.cloudflareaccess.com/cdn-cgi/access/login';
  const fetcher = async (url, options) => {
    calls.push({ url, ...options });
    if (!options.headers['CF-Access-Client-Id']) {
      return new Response(null, { status: 302, headers: { location: accessUrl } });
    }
    return new Response('<html>Preview</html>');
  };
  assert.deepEqual(await fetchProtectedRoutes(origin, ['/pl/'], credentials, fetcher), ['<html>Preview</html>']);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].headers, {});
  assert.equal(calls[1].headers['CF-Access-Client-Secret'], 'test-secret');
  assert(calls.every(call => call.url === origin + '/pl/' && call.redirect === 'manual'));
  await assert.rejects(fetchProtectedRoutes(origin, ['/pl/'], credentials, async () => new Response('public')), /did not block/);
  await assert.rejects(fetchProtectedRoutes(origin, ['/pl/'], credentials, async () => new Response(null, {
    status: 302, headers: { location: 'https://example.com/login' }
  })), /did not block/);
  await assert.rejects(fetchProtectedRoutes(origin, ['/pl/'], credentials, async (_, options) =>
    new Response(null, { status: options.headers['CF-Access-Client-Id'] ? 302 : 403 })
  ), /did not return HTTP 200/);
});

test('requires bilingual exercise markup, both feeds, and an empty preview sitemap', () => {
  const id = 'exercise-123';
  const html = '<html>' + ' '.repeat(1600) + id + ' quick-decision</html>';
  const rss = '<rss>' + id + '</rss>';
  const valid = [html, html, html, html, rss, rss, '<urlset></urlset>'];
  assert.doesNotThrow(() => verifyPreviewBodies(id, valid));
  assert.throws(() => verifyPreviewBodies(id, [...valid.slice(0, 5), '<rss></rss>', valid[6]]), /absent from Preview RSS/);
  assert.throws(() => verifyPreviewBodies(id, [...valid.slice(0, 6), '<urlset><url><loc>public</loc></url></urlset>']), /indexed routes/);
});
