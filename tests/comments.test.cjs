const { test } = require('node:test');
const assert = require('node:assert/strict');
const { classify, moderateComment } = require('../api/_comment-moderation');
const handler = require('../api/comments');
const contexts = require('../api/_comment-context.json');
const good = { decision: 'approve', spam: false, abuse: false, relevant: true, confidence: 0.97, reason: 'Merytoryczna uwaga.' };
const apiResult = value => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] });
const reply = (status, data) => ({ status, ok: status >= 200 && status < 300, json: async () => data });
function response() { return { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; } }; }
async function scenario(t, options = {}) {
  const calls = [];
  const original = global.fetch;
  const saved = { ...process.env };
  Object.assign(process.env, { TURNSTILE_SECRET_KEY: 'test', LH_STORAGE_TOKEN: 'test', LH_STORAGE_URL: 'https://store.example/save.php', OPENAI_API_KEY: 'test', VERCEL_ENV: 'production' });
  if (options.noKey) delete process.env.OPENAI_API_KEY;
  t.after(() => { global.fetch = original; process.env = saved; });
  global.fetch = async (url, init) => {
    if (url.includes('cloudflare')) { calls.push('turnstile'); return reply(200, { success: !options.bot, hostname: 'ejsymont.com' }); }
    const data = JSON.parse(init.body);
    if (url.includes('api.openai.com')) {
      calls.push('ai');
      assert.equal(data.store, false);
      assert.ok(!init.body.includes('reader@example.org'));
      assert.ok(!init.body.includes('sourceHash'));
      assert.ok(JSON.parse(data.input).article.text.length > 10);
      assert.equal(data.text.format.strict, true);
      if (options.aiError) throw new Error('timeout');
      return reply(200, options.aiResponse || apiResult(options.verdict || good));
    }
    calls.push(data.action);
    if (data.action === 'create') return reply(options.rateLimit ? 429 : 201, { ok: true });
    if (data.action === 'verify') return reply(options.verifyError ? 503 : 200, { ok: true });
    if (data.action === 'moderate') {
      assert.equal(data.decision, options.expectedDecision || 'approved');
      return reply(options.writeError ? 503 : 200, { ok: true });
    }
    throw new Error('Unexpected call');
  };
  const res = response();
  await handler({ method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' }, body: { articlePath: options.path || Object.keys(contexts).find(p => !p.startsWith('/en/')), locale: 'pl', name: 'Reader', email: 'reader@example.org', message: 'Jak zmierzyć czas odtworzenia usługi?', turnstileToken: 'test' } }, res);
  return { res, calls };
}
test('conservative decision gate sends inconsistent, uncertain and malformed results to review', () => {
  assert.equal(classify(good), 'approved');
  for (const value of [null, {}, { ...good, spam: true }, { ...good, relevant: false }, { ...good, confidence: 0.8 }, { ...good, confidence: NaN }, { ...good, confidence: 2 }, { ...good, reason: '' }, { ...good, decision: 'reject' }]) assert.equal(classify(value), 'pending');
  assert.equal(classify({ ...good, decision: 'reject', spam: true, confidence: 0.99 }), 'rejected');
});
test('safe comment publishes only after persisted queue and AI evaluation', async t => {
  const { res, calls } = await scenario(t);
  assert.equal(res.code, 201); assert.equal(res.data.status, 'approved');
  assert.deepEqual(calls, ['turnstile', 'create', 'verify', 'ai', 'moderate']);
  assert.deepEqual(Object.keys(res.data).sort(), ['comment', 'ok', 'status']);
  assert.match(res.data.comment.id, /^[0-9a-f-]{36}$/i);
  assert.equal(res.data.comment.display_name, 'Reader');
  assert.equal(res.data.comment.body, 'Jak zmierzyć czas odtworzenia usługi?');
  assert.ok(!JSON.stringify(res.data).includes('reader@example.org'));
});
test('clear spam is rejected', async t => {
  const { res } = await scenario(t, { verdict: { ...good, decision: 'reject', spam: true, confidence: 0.99 }, expectedDecision: 'rejected' });
  assert.equal(res.code, 202); assert.equal(res.data.status, 'rejected');
  assert.equal(res.data.comment, undefined);
});
for (const [name, options] of Object.entries({ uncertain: { verdict: { ...good, confidence: 0.7 } }, timeout: { aiError: true }, missingKey: { noKey: true }, refusal: { aiResponse: { status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal' }] }] } }, incomplete: { aiResponse: { status: 'incomplete', output: [] } }, malformed: { aiResponse: apiResult({}) }, updateFailure: { writeError: true } })) {
  test(name + ' retains comment for manual review without claiming publication', async t => {
    const { res, calls } = await scenario(t, options);
    assert.equal(res.code, 202); assert.equal(res.data.status, 'pending');
    assert.equal(res.data.comment, undefined);
    if (!options.writeError) assert.ok(!calls.includes('moderate'));
  });
}
test('queue transition failure never runs AI or reports success', async t => {
  const { res, calls } = await scenario(t, { verifyError: true });
  assert.equal(res.code, 503); assert.ok(!calls.includes('ai'));
});
test('rate limit precedes AI cost', async t => {
  const { res, calls } = await scenario(t, { rateLimit: true });
  assert.equal(res.code, 429); assert.ok(!calls.includes('ai'));
});
test('bot rejection precedes storage and AI', async t => {
  const { res, calls } = await scenario(t, { bot: true });
  assert.equal(res.code, 400); assert.deepEqual(calls, ['turnstile']);
});
test('unpublished article paths cannot consume AI or create comments', async t => {
  const { res, calls } = await scenario(t, { path: '/podstawy-architektury/not-published/' });
  assert.equal(res.code, 400); assert.deepEqual(calls, []);
});
