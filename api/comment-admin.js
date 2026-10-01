const { storage, safeEqual, escapeHtml } = require('./_comments');
const deny = (res) => {
  res.setHeader('WWW-Authenticate', 'Basic realm="ArchitectMentor moderation", charset="UTF-8"');
  return res.status(401).send('Authentication required');
};
const page = (body) => '<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Moderacja | ArchitectMentor</title><style>body{font:16px/1.5 system-ui;max-width:55rem;margin:2rem auto;padding:1rem;color:#182637}article{border:1px solid #ccd;padding:1rem;margin:1rem 0;border-radius:.5rem;white-space:pre-wrap;overflow-wrap:anywhere}button{padding:.6rem;margin:.5rem .5rem 0 0;cursor:pointer}</style><h1>Komentarze oczekujące</h1>' + body + '</html>';
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  const password = process.env.COMMENT_ADMIN_PASSWORD;
  if (!password || password.length < 24 || !safeEqual(
    String(req.headers.authorization || '').startsWith('Basic ') ?
      Buffer.from(String(req.headers.authorization).slice(6), 'base64').toString('utf8').split(':').slice(1).join(':') : '',
    password
  )) return deny(res);
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    const expected = 'https://' + req.headers.host;
    if (origin !== expected || !String(req.headers['content-type'] || '').startsWith('application/x-www-form-urlencoded')) {
      return res.status(403).send('Forbidden');
    }
    const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body;
    const id = body?.id, decision = body?.decision;
    if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['approved','rejected'].includes(decision)) {
      return res.status(400).send('Invalid decision');
    }
    const result = await storage({ action: 'moderate', id, decision });
    if (result.status !== 200) return res.status(503).send('Moderation failed');
    res.setHeader('Location', '/api/comment-admin');
    return res.status(303).end();
  }
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const result = await storage({ action: 'queue' });
  if (result.status !== 200) return res.status(503).send('Storage unavailable');
  const rows = result.data.comments || [];
  const configNotice = process.env.OPENAI_API_KEY ? '' : '<p><strong>Brak OPENAI_API_KEY: nowe komentarze czekają na ręczną moderację.</strong></p>';
  const count = '<p>Do sprawdzenia: ' + rows.length + (rows.length === 100 ? ' (pierwsze 100)' : '') + '. AI publikuje poprawne komentarze; tutaj trafiają przypadki niejednoznaczne i błędy oceny.</p>';
  const html = rows.map(item => '<article><strong>' + escapeHtml(item.display_name) + '</strong> · ' +
    escapeHtml(item.email) + ' · ' + escapeHtml(item.created_at) + '<br><small>' + '<a href="https://ejsymont.com' + escapeHtml(item.article_path) + '">' + escapeHtml(item.article_path) + '</a>' +
    '</small><p>' + escapeHtml(item.body) + '</p><form method="post" action="/api/comment-admin">' +
    '<input type="hidden" name="id" value="' + escapeHtml(item.id) + '">' +
    '<button name="decision" value="approved">Opublikuj</button><button name="decision" value="rejected">Odrzuć</button>' +
    '</form></article>').join('');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page(configNotice + count + (html || '<p>Brak komentarzy do sprawdzenia.</p>')));
};
