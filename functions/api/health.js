// Readiness checks configuration only, not OpenAI, SMTP or LH database connectivity.
export function onRequestGet({env}) {
  const configured = !!(env.OPENAI_API_KEY && env.LH_STORAGE_URL && env.LH_STORAGE_TOKEN);
  return new Response(JSON.stringify({service:'architectmentor-api', status:configured?'configured':'degraded'}), {
    status:configured?200:503,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
  });
}
