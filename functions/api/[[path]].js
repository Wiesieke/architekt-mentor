// Migration-stage safety fallback. Not a replacement for the Vercel APIs.
// Static pages must remain available even when the old API host is paused.
// Remove this only after migrating, testing and authorizing each API endpoint.
export function onRequest() {
  return new Response(JSON.stringify({
    error: "service_temporarily_unavailable",
    message: "Interactive ArchitectMentor functions are temporarily unavailable during hosting migration."
  }), {
    status: 503,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}
