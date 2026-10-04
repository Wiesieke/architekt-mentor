import { articles, articleUrl } from './articles';
import { englishArticles, englishArticleUrl } from './articles-en';
import { learningCatalogue } from './learning';
import puzzles from '../../data/puzzles.json';
import patterns from '../../data/antywzorce.json';
import { englishPuzzles } from './puzzles-en';
import { englishAntipatterns } from './antipatterns-en';
export type CatalogueKind = 'learning' | 'practice' | 'antipatterns' | 'motion' | 'ai';
export type CatalogueRow = { title:string; description:string; topic:string; href:string; published:string; group:string; difficulty?:string; eventDate?:string; kind?:string };
const areas = [
 {id:'integration',pl:'Integracja i API',en:'Integration and APIs'},
 {id:'data',pl:'Dane i migracje',en:'Data and migrations'},
 {id:'resilience',pl:'Odporność i odtwarzanie',en:'Resilience and recovery'},
 {id:'security',pl:'Bezpieczeństwo',en:'Security'},
 {id:'decisions',pl:'Analiza i decyzje',en:'Analysis and decisions'},
];
const assignments: Record<string,string> = {
 '2026-10-03-opcjonalne-pole-api':'integration','2026-10-02-email-po-zamowieniu':'integration',
 '2026-10-01-wymiana-urzadzen':'decisions','2026-10-01-nieznany-wynik-transakcji':'integration',
 '2026-10-01-opcjonalny-zapis':'resilience','2026-10-01-cache-bez-tenanta':'security',
 '2026-09-30-odtwarzanie-po-awarii':'resilience','2026-09-29-expand-contract':'data',
 '2026-w40-izolacja-zasobow':'resilience','2026-w39-anon-managed-platform':'decisions',
 '2026-w27-dual-write':'data','2026-w39-retry-idempotency':'integration',
 '2026-10-03-zgodnosc-tylko-w-schemacie':'integration','2026-10-02-powiadomienie-steruje-transakcja':'integration',
 '2026-10-01-autoryzacja-tylko-na-wejsciu':'security','2026-09-30-backup-bez-proby-odtworzenia':'resilience',
 '2026-09-29-migracja-schematu-jeden-krok':'data','2026-09-wspolna-pula-zaleznosci':'resilience',
 '2026-09-anon-temporary-file-integration':'decisions','2026-07-rozproszony-monolit':'integration',
 '2026-09-wspolna-baza-integracyjna':'data',
};
function area(id:string, locale:'pl'|'en') {
 const a=areas.find(a=>a.id===assignments[id]);
 if(!a) throw new Error(`Missing catalogue area: ${id}`);
 return {id:a.id,title:a[locale]};
}
// Week is based on publication date; for legacy undated articles use event date explicitly.
function week(date:string, locale:'pl'|'en') {
 if(!date) return {id:'undated',title:locale==='pl'?'Starsze materiały bez daty publikacji':'Earlier articles without a publication date'};
 const d=new Date(`${date}T12:00:00Z`); const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()-day+1);
 const monday=d.toISOString().slice(0,10); const end=new Date(d);end.setUTCDate(d.getUTCDate()+6);
 const format=(v:Date)=>new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(v);
 return {id:monday,title:`${format(d)} – ${format(end)}`};
}
export function catalogue(kind:CatalogueKind,locale:'pl'|'en') {
 if(kind==='learning') return learningCatalogue(locale);
 let rows:CatalogueRow[]=[]; const labels=new Map<string,string>();
 if(kind==='practice') rows=puzzles.map(p=>{
  const en=englishPuzzles.find(e=>e.id===p.id);if(!en?.title)throw new Error(`Missing English puzzle: ${p.id}`);
  const item=locale==='en'?en:p;const g=area(p.id,locale);labels.set(g.id,g.title);
  return {title:item.title,description:('goal' in item && item.goal) || item.question,topic:g.title,group:g.id,
   href:locale==='en'?`/en/practice/${p.id}/`:`/lamiglowki/${p.id}/`,published:p.date,
   difficulty:locale==='en'?({'Łatwy':'Easy','Średni':'Intermediate','Zaawansowany':'Advanced'}[p.difficulty]??item.difficulty):p.difficulty};
 });
 else if(kind==='antipatterns') rows=patterns.map(p=>{
  const en=englishAntipatterns.find(e=>e.id===p.id);if(!en?.title)throw new Error(`Missing English anti-pattern: ${p.id}`);
  const item=locale==='en'?en:p;const g=area(p.id,locale);labels.set(g.id,g.title);
  return {title:item.title,description:item.summary,topic:g.title,group:g.id,href:locale==='en'?`/en/anti-patterns/${p.id}/`:`/antywzorce/${p.id}/`,published:p.date};
 });
 else rows=articles.filter(a=>a.section===(kind==='motion'?'architektura-w-ruchu':'architektura-it-ai')).map(a=>{
  const en=englishArticles.find(e=>e.plSlug===a.slug && e.section===(kind==='motion'?'architecture-in-motion':'architecture-with-ai'));
  if(!en)throw new Error(`Missing English article: ${a.slug}`);
  const item=locale==='en'?en:a;const g=kind==='motion'?week(a.published??a.eventDate??'',locale):{id:'ai',title:locale==='pl'?'Architektura i AI':'Architecture and AI'};labels.set(g.id,g.title);
  return {title:item.title,description:item.description,topic:item.topic,group:g.id,href:locale==='en'?englishArticleUrl(en):articleUrl(a),published:a.published??'',eventDate:a.eventDate};
 });
 rows.sort((a,b)=>(b.published||b.eventDate||'').localeCompare(a.published||a.eventDate||''));
 const groups=[...labels].map(([id,title])=>({id,title,items:rows.filter(r=>r.group===id)})).sort((a,b)=>rows.indexOf(a.items[0])-rows.indexOf(b.items[0]));
 return {rows,groups};
}
export function searchCatalogue(locale:'pl'|'en') {
 const kinds:CatalogueKind[]=['learning','practice','antipatterns','motion','ai'];
 const names=locale==='pl'?['Ucz się','Ćwicz','Antywzorce','Architektura w ruchu','Architekt i AI']:['Foundations','Practice','Anti-patterns','Architecture in motion','Architect + AI'];
 return kinds.flatMap((kind,i)=>catalogue(kind,locale).rows.map(row=>({...row,kind:names[i]})));
}
