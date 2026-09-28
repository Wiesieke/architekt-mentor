import type { APIRoute } from 'astro';
import { articles, articleUrl } from '../data/articles';
import { latestEditionDate } from '../data/editions';
import patterns from '../../data/antywzorce.json';

export const GET: APIRoute = () => {
  // Preview sites remain out of the index. Publish the map only after migration.
  const pages = import.meta.env.PUBLIC_SITE_INDEXABLE === 'true'
    ? [
      {path:'/', modified:latestEditionDate},
      {path:'/lamiglowka/'},
      {path:'/narzedzia/'},
      {path:'/narzedzia/adr/'},
      {path:'/architektura-w-ruchu/'},
      {path:'/podstawy-architektury/'},
      {path:'/antywzorce/'},
      ...articles.map(a => ({path:articleUrl(a), modified:a.published})),
      ...patterns.map(p => ({path:`/antywzorce/${p.id}/`, modified:p.date})),
    ] : [];
  const entries = pages.map(p => `<url><loc>${new URL(p.path,'https://ejsymont.com').href}</loc>${p.modified ? `<lastmod>${p.modified}</lastmod>` : ''}</url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {headers:{'content-type':'application/xml; charset=utf-8'}});
};
