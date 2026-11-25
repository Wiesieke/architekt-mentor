export const localHeaders = {
  'Cache-Control':'no-store',
  'X-Robots-Tag':'noindex, nofollow',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer'
};

export function isLocalRequest(request, url, address) {
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  return loopback.includes(address)
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    && request.headers.get('host') === url.host
    && ![...request.headers.keys()].some(name => name === 'forwarded' || name.startsWith('x-forwarded-'))
    && (!request.headers.has('origin') || request.headers.get('origin') === url.origin)
    && !['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site'));
}
