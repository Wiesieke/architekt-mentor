import type { APIRoute } from 'astro';
import { renderFeed } from '../../data/feed';
export const GET: APIRoute = () => new Response(renderFeed('en'), { headers: { 'content-type':'application/rss+xml; charset=utf-8', 'cache-control':'public, max-age=300' } });
