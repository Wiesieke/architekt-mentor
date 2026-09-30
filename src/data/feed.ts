import { articles, articleUrl } from './articles';
import { englishArticles, englishArticleUrl } from './articles-en';
import patterns from '../../data/antywzorce.json';
import { englishAntipatterns } from './antipatterns-en';

type FeedItem = { title: string; description: string; url: string; published: string };
const origin = 'https://ejsymont.com';
const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));

export function renderFeed(locale: 'pl' | 'en') {
  // Undated legacy articles have no trustworthy publication timestamp and stay out of RSS.
  const items: FeedItem[] = locale === 'pl'
    ? [
        ...articles.filter(article => article.published).map(article => ({title:article.title, description:article.description, url:articleUrl(article), published:article.published!})),
        ...patterns.map(pattern => ({title:pattern.title, description:pattern.summary, url:`/antywzorce/${pattern.id}/`, published:pattern.date})),
      ]
    : [
        ...englishArticles.filter(article => article.published).map(article => ({title:article.title, description:article.description, url:englishArticleUrl(article), published:article.published!})),
        ...englishAntipatterns.filter(pattern => pattern.title && pattern.summary).map(pattern => ({title:pattern.title, description:pattern.summary, url:`/en/anti-patterns/${pattern.id}/`, published:pattern.date})),
      ];
  items.sort((a,b) => b.published.localeCompare(a.published) || a.url.localeCompare(b.url));
  const feedUrl = `${origin}${locale === 'pl' ? '/rss.xml' : '/en/rss.xml'}`;
  const title = locale === 'pl' ? 'ArchitectMentor — artykuły i antywzorce' : 'ArchitectMentor — articles and anti-patterns';
  const description = locale === 'pl' ? 'Nowe materiały o praktyce architektury IT' : 'New practical IT architecture articles';
  const entries = items.slice(0,40).map(item => {
    const link = `${origin}${item.url}`;
    const date = new Date(`${item.published}T12:00:00Z`).toUTCString();
    return `<item><title>${escapeXml(item.title)}</title><link>${escapeXml(link)}</link><guid isPermaLink="true">${escapeXml(link)}</guid><pubDate>${date}</pubDate><description>${escapeXml(item.description)}</description></item>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(title)}</title><link>${origin}${locale === 'pl' ? '/pl/' : '/en/'}</link><description>${escapeXml(description)}</description><language>${locale}</language><atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>${entries}</channel></rss>`;
}
