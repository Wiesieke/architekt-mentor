const { createHash, randomUUID, timingSafeEqual } = require('node:crypto');

function storageUrl() {
  const source = process.env.LH_STORAGE_URL || '';
  if (!/^https:\/\/[^/?#]+\/(?:[a-z0-9_-]+\/)*save\.php$/i.test(source)) return null;
  return source.replace(/save\.php$/i, 'comments.php');
}

function validPath(path, locale) {
  return typeof path === 'string' && /^(?:\/(?:podstawy-architektury|architektura-w-ruchu|architektura-it-ai|antywzorce)|\/en\/(?:foundations|architecture-in-motion|architecture-with-ai|anti-patterns))\/[a-z0-9-]+\/$/.test(path) &&
    (locale === 'en' ? path.startsWith('/en/') : locale === 'pl' && !path.startsWith('/en/'));
}

async function storage(data) {
  const url = storageUrl();
  if (!url || !process.env.LH_STORAGE_TOKEN) return { status: 503, data: { error: 'Unavailable' } };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-store-token': process.env.LH_STORAGE_TOKEN },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(7000)
    });
    const result = await response.json();
    return { status: response.status, data: result };
  } catch {
    return { status: 503, data: { error: 'Unavailable' } };
  }
}

function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function hash(value) { return createHash('sha256').update(value).digest('hex'); }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
module.exports = { storage, validPath, safeEqual, hash, escapeHtml, randomUUID };
