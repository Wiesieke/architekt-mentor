// Locale choice is only automatic on the entry URL. Explicit language URLs
// must remain stable so a visitor can always override the country guess.
export default function middleware(request: Request) {
  const country = request.headers.get('x-vercel-ip-country');
  const destination = new URL(country === 'PL' ? '/pl/' : '/en/', request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.toString(),
      'Cache-Control': 'private, no-store',
      Vary: 'x-vercel-ip-country',
    },
  });
}

export const config = { matcher: '/' };
