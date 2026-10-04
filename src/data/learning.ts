import { articles, articleUrl } from './articles';
import { englishArticles, englishArticleUrl } from './articles-en';

// Controlled editorial taxonomy: add a group deliberately, not from free-text topic labels.
export const learningGroups = [
  { id: 'integration', pl: 'Integracja i API', en: 'Integration and APIs', slugs: ['ewolucja-kontraktu-api', 'komunikacja-asynchroniczna-powiadomienia', 'idempotencja-lookup-kompensacja', 'wzorce'] },
  { id: 'analysis', pl: 'Analiza i decyzje', en: 'Analysis and decisions', slugs: ['analiza-wplywu-zmiany', 'adr', 'checklista'] },
  { id: 'resilience', pl: 'Odporność i odtwarzanie', en: 'Resilience and recovery', slugs: ['graceful-degradation', 'rpo-rto-proba-odtworzenia', 'bulkhead'] },
  { id: 'security', pl: 'Bezpieczeństwo', en: 'Security', slugs: ['izolacja-tenantow-niezmiennik'] },
  { id: 'quality', pl: 'Jakość i pomiar', en: 'Quality and measurement', slugs: ['scenariusze-atrybutow-jakosciowych', 'slo-budzet-bledow'] },
  { id: 'description', pl: 'Opis i modele architektury', en: 'Architecture descriptions and models', slugs: ['opis', 'c4', 'ramy'] },
];

export function learningCatalogue(locale: 'pl' | 'en') {
  const foundations = articles.filter(a => a.section === 'podstawy-architektury');
  const rows = foundations.map(a => {
    const groups = learningGroups.filter(g => g.slugs.includes(a.slug));
    if (groups.length !== 1) throw new Error(`Learning article needs exactly one group: ${a.slug}`);
    const en = englishArticles.find(e => e.section === 'foundations' && e.plSlug === a.slug);
    if (!en) throw new Error(`Missing English learning pair: ${a.slug}`);
    const item = locale === 'en' ? en : a;
    return { title: item.title, description: item.description, topic: item.topic,
      href: locale === 'en' ? englishArticleUrl(en) : articleUrl(a),
      published: a.published ?? '', group: groups[0].id };
  }).sort((a, b) => b.published.localeCompare(a.published));
  const groups = learningGroups.map(g => ({ id: g.id, title: g[locale], items: rows.filter(r => r.group === g.id) }))
    .filter(g => g.items.length).sort((a, b) => (b.items[0].published).localeCompare(a.items[0].published));
  return { rows, groups };
}
