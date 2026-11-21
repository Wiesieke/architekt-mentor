// Cloudflare Pages adapter for the existing reviewed Vercel-style handlers.
// Keep responses isolated per request; never mutate global environment secrets.
const MAX_BODY_BYTES = 65536;

function makeJsonError(status, message) {
  return new Response(JSON.stringify({error: message}), {
    status, headers: {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'}
  });
}

async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > MAX_BODY_BYTES) throw new RangeError('body_too_large');
  // Limit actual bytes as well, because chunked requests may omit Content-Length.
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES) throw new RangeError('body_too_large');
  const raw = new TextDecoder().decode(bytes);
  if (String(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export async function invokeNodeHandler(handler, context) {
  const {request} = context;
  if (typeof handler !== 'function') return makeJsonError(503, 'API unavailable');
  const url = new URL(request.url);
  let body;
  try { body = await readBody(request); }
  catch (error) {
    if (error instanceof RangeError) return makeJsonError(413, 'Request too large');
    return makeJsonError(400, 'Invalid request');
  }

  const headers = Object.fromEntries(request.headers.entries());
  headers.host = url.host;
  // x-forwarded-for is user-supplied on some edges; use the verified Cloudflare header.
  headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || '';
  const req = {
    method: request.method.toUpperCase(),
    url: url.pathname + url.search,
    headers,
    query: Object.fromEntries(url.searchParams.entries()),
    body
  };

  let statusCode = 200;
  let sent = null;
  const responseHeaders = new Headers({'cache-control':'no-store'});
  const deliver = (value, json) => {
    if (sent) return sent;
    if (json && !responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'application/json; charset=utf-8');
    }
    const payload = json ? JSON.stringify(value) : value == null ? null : String(value);
    sent = new Response(payload, {status: statusCode, headers: responseHeaders});
    return sent;
  };
  const res = {
    setHeader(name, value) { responseHeaders.set(name, String(value)); return res; },
    status(code) {
      const n = Number(code);
      statusCode = Number.isInteger(n) && n >= 100 && n <= 599 ? n : 500;
      return res;
    },
    json(value) { return deliver(value, true); },
    send(value) { return deliver(value, false); },
    end(value) { return deliver(value, false); }
  };

  try {
    await handler(req, res);
    return sent || makeJsonError(500, 'Empty API response');
  } catch (error) {
    // Do not log request bodies, secrets or private architectural briefs.
    console.error('ArchitectMentor API handler failed', {path:url.pathname, type:error?.name || 'Error'});
    return makeJsonError(502, 'API request failed');
  }
}
