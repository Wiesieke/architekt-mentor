import type { APIRoute } from 'astro';
export const GET: APIRoute = () => new Response(`User-agent: *\nAllow: /\n${import.meta.env.PUBLIC_SITE_INDEXABLE === 'true' ? 'Sitemap: https://ejsymont.com/sitemap.xml\n' : ''}`, {headers:{'content-type':'text/plain; charset=utf-8'}});
