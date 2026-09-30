const { randomBytes, createHmac } = require('node:crypto');
const { moderateComment } = require('./_comment-moderation');
const articleContexts = require('./_comment-context.json');
const { storage, validPath, hash, randomUUID } = require('./_comments');

const unavailable = (res) => res.status(503).json({ error: 'Comments are temporarily unavailable.' });
const previewHost = 'project-ead46-git-feature-moderated-comments-my-c.vercel.app';
const publicHost = () => process.env.VERCEL_ENV === 'preview' ? (process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL || previewHost) : 'ejsymont.com';
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET' && req.query.action === 'verify') {
    const id = req.query.id, token = req.query.token;
    const good = typeof id === 'string' && /^[0-9a-f-]{36}$/i.test(id) &&
      typeof token === 'string' && /^[a-f0-9]{64}$/.test(token);
    const result = good ? await storage({ action: 'verify', id, verificationHash: hash(token) }) : { status: 400 };
    if (result.status === 503) return res.status(503).send('Verification temporarily unavailable');
    const verified = result.status === 200;
    const heading = verified ? 'Email confirmed / Adres potwierdzony' : 'Link expired or invalid / Link wygasł lub jest nieprawidłowy';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
    return res.status(verified ? 200 : 400).send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>ArchitectMentor</title><body style="font:18px system-ui;max-width:40rem;margin:10vh auto;padding:1rem"><h1>' + heading + '</h1><p>' + (verified ? 'Your comment awaits moderation. / Komentarz czeka na moderację.' : 'Please submit the comment again. / Wyślij komentarz ponownie.') + '</p><a href="https://ejsymont.com/">ArchitectMentor</a></body></html>');
  }
  if (req.method === 'GET') {
    const articlePath = req.query.article, language = req.query.locale;
    if (!validPath(articlePath, language)) return res.status(400).json({ error: 'Invalid article.' });
    const result = await storage({ action: 'public', articlePath, locale: language });
    return result.status === 200 ? res.status(200).json(result.data) : unavailable(res);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.TURNSTILE_SECRET_KEY || !process.env.LH_STORAGE_TOKEN) return unavailable(res);
  if (Number(req.headers['content-length']) > 6500 ||
      !String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(400).json({ error: 'Invalid request.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid request.' });
  if (body.website) return res.status(200).json({ ok: true });
  const articlePath = body.articlePath, language = body.locale;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!validPath(articlePath, language) || !articleContexts[articlePath] || name.length < 2 || name.length > 80 || /[<>\r\n]/.test(name) ||
      email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 10 || message.length > 2500 || typeof body.turnstileToken !== 'string' ||
      body.turnstileToken.length > 2048 || !body.turnstileToken) {
    return res.status(400).json({ error: language === 'en' ? 'Check the form fields.' : 'Sprawdź pola formularza.' });
  }
  try {
    const challenge = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: body.turnstileToken }),
      signal: AbortSignal.timeout(5000)
    });
    const verdict = await challenge.json();
    if (!verdict.success || verdict.hostname !== publicHost()) return res.status(400).json({ error: 'Verification failed. / Weryfikacja nie powiodła się.' });
  } catch { return unavailable(res); }
  const id = randomUUID(), token = randomBytes(32).toString('hex');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const sourceHash = createHmac('sha256', process.env.LH_STORAGE_TOKEN).update(ip || email).digest('hex');
  const result = await storage({ action: 'create', id, articlePath, locale: language, name, email, body: message,
    sourceHash, verificationHash: hash(token) });
  if (result.status === 429) return res.status(429).json({ error: language === 'en' ? 'Please try again tomorrow.' : 'Spróbuj ponownie jutro.' });
  if (result.status !== 201) return unavailable(res);
  // Compatibility with the deployed LH.pl bridge: unlock the manual queue using
  // the server-only token. This records a technical transition, not verified email ownership.
  const queued = await storage({ action: 'verify', id, verificationHash: hash(token) });
  if (queued.status !== 200) return unavailable(res);
  const decision = await moderateComment({ article: articleContexts[articlePath], name, message });
  let status = 'pending';
  if (decision !== 'pending') {
    const applied = await storage({ action: 'moderate', id, decision });
    if (applied.status === 200) status = decision;
    // A failed/uncertain write never promises publication. The saved row remains
    // visible in the manual queue unless the bridge already committed the update.
  }
  return res.status(status === 'approved' ? 201 : 202).json({ ok: true, status });
};
