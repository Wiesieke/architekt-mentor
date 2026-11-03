/**
 * Derive "Latest publication" from the union of the curated edition index and
 * the actually published article registry. A Desk release writes both language
 * registries but does not need to mutate src/data/editions.ts.
 *
 * No draft or queue metadata is consulted: only site-published articles
 * count. An already-listed editorial entry must not appear twice.
 */
export function assembleLatestEdition(editions, articles, articleUrl) {
 const published=articles.filter(a=>typeof a.published==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(a.published));
 const latestArticleDate=published.reduce((max,a)=>a.published>max?a.published:max,'');
 const latestIndexDate=editions.reduce((max,e)=>e.published>max?e.published:max,'');
 const date=latestArticleDate>latestIndexDate?latestArticleDate:latestIndexDate;
 const selected=editions.filter(e=>e.published===date);
 const registered=new Set(selected.map(e=>e.href));
 const appended=published.filter(a=>a.published===date&&!registered.has(articleUrl(a)))
   .map(a=>({
     kind:a.section==='podstawy-architektury'?'PODSTAWY':
       a.section==='architektura-it-ai'?'ARCHITEKT I AI':'W RUCHU',
     title:a.title,
     summary:a.description,
     href:articleUrl(a),
     published:a.published
   }));
 return {date, entries:[...selected,...appended]};
}
