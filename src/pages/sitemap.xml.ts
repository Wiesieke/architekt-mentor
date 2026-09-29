import type { APIRoute } from 'astro';
import { articles, articleUrl } from '../data/articles';
import { latestEditionDate } from '../data/editions';
import patterns from '../../data/antywzorce.json';
import puzzles from '../../data/puzzles.json';
import { englishArticles, englishArticleUrl } from '../data/articles-en';

export const GET: APIRoute = () => {
  // Preview sites remain out of the index; production gets the full map.
  const pages = (process.env.VERCEL_ENV === 'production' || import.meta.env.PUBLIC_SITE_INDEXABLE === 'true')
    ? [
      {path:'/pl/', modified:latestEditionDate},
      {path:'/lamiglowka/'},
      {path:'/lamiglowki/'},
      ...puzzles.filter(p => p.id !== [...puzzles].filter(item => item.coach).sort((a,b) => b.date.localeCompare(a.date))[0].id).map(p => ({path:`/lamiglowki/${p.id}/`,modified:p.date})),
      {path:'/narzedzia/'},
      {path:'/narzedzia/adr/'},
      {path:'/narzedzia/hld/'},
      {path:'/dlafirm/'},
      {path:'/informacja-o-danych/'},
      {path:'/newsletter/'},
      {path:'/architektura-w-ruchu/'},
      {path:'/podstawy-architektury/'},
      {path:'/antywzorce/'},
      {path:'/en/'},
      {path:'/en/practice/'},
      {path:'/en/practice/archive/'},
      ...puzzles.filter(p => p.id !== [...puzzles].filter(item => item.coach).sort((a,b) => b.date.localeCompare(a.date))[0].id).map(p => ({path:`/en/practice/${p.id}/`,modified:p.date})),
      {path:'/en/tools/'},
      {path:'/en/tools/adr/'},
      {path:'/en/tools/hld/'},
      {path:'/en/for-business/'},
      {path:'/en/data-notice/'},
      {path:'/en/newsletter/'},
      {path:'/en/anti-patterns/'},
      ...patterns.map(p => ({path:`/en/anti-patterns/${p.id}/`,modified:p.date})),
      {path:'/en/architecture-in-motion/'},
      {path:'/en/foundations/'},
      ...englishArticles.map(a => ({path:englishArticleUrl(a), modified:a.published})),
      ...articles.map(a => ({path:articleUrl(a), modified:a.published})),
      ...patterns.map(p => ({path:`/antywzorce/${p.id}/`, modified:p.date})),
    ] : [];
  const entries = pages.map(p => `<url><loc>${new URL(p.path,'https://ejsymont.com').href}</loc>${p.modified ? `<lastmod>${p.modified}</lastmod>` : ''}</url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`, {headers:{'content-type':'application/xml; charset=utf-8'}});
};
