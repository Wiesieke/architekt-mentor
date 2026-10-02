import { articles, articleUrl } from './articles';
import { englishArticles, englishArticleUrl, polishArticleUrl } from './articles-en';
import { editions, latestEditionDate } from './editions';
import { englishPuzzles } from './puzzles-en';
import { englishAntipatterns } from './antipatterns-en';
import puzzles from '../../data/puzzles.json';
import translations from './homepage-copy.json';

// Both editions use the same editorial index; missing translations fail the build.
export function homepageData(locale: 'pl' | 'en') {
  const en = locale === 'en';
  const copy = translations[locale];
  const edition = editions.filter(item => item.published === latestEditionDate).map(item => {
    if (!en) return {kind:item.kind,href:item.href,title:item.title,summary:item.summary};
    if (item.kind === 'ĆWICZENIE') {
      const source = puzzles.find(p => p.title === item.title && p.date === item.published);
      const translated = englishPuzzles.find(p => p.id === source?.id);
      if (!translated) throw new Error(`Missing EN homepage exercise: ${item.title}`);
      return {kind:item.kind,href:`/en/practice/${translated.id}/`,title:translated.title,summary:'Quick decision · mentor · senior analysis →'};
    }
    if (item.kind === 'ANTYWZORZEC') {
      const translated = englishAntipatterns.find(p => item.href === `/antywzorce/${p.id}/`);
      if (!translated?.title) throw new Error(`Missing EN homepage anti-pattern: ${item.href}`);
      return {kind:item.kind,href:`/en/anti-patterns/${translated.id}/`,title:translated.title,summary:translated.summary};
    }
    const translated = englishArticles.find(a => polishArticleUrl(a) === item.href);
    if (!translated) throw new Error(`Missing EN homepage article: ${item.href}`);
    return {kind:item.kind,href:englishArticleUrl(translated),title:translated.title,summary:translated.description};
  });
  const source = [...articles].filter(a => a.published).sort((a,b)=>b.published!.localeCompare(a.published!))[0];
  const featured = en ? englishArticles.find(a => polishArticleUrl(a) === articleUrl(source))! : source;
  if (!featured) throw new Error('Missing featured article translation');
  const foundation = en ? englishArticles.find(a=>a.slug==='bulkhead')! : articles.find(a=>a.slug==='bulkhead')!;
  const url = (article: typeof source | typeof featured) => en ? englishArticleUrl(article as typeof englishArticles[number]) : articleUrl(article as typeof articles[number]);
  const kind = source.section === 'architektura-it-ai' ? 'ARCHITEKT I AI' : source.section === 'podstawy-architektury' ? 'PODSTAWY' : 'W RUCHU';
  return {
    edition, date:latestEditionDate,
    dateLabel:new Intl.DateTimeFormat(en?'en-GB':'pl-PL',{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${latestEditionDate}T12:00:00Z`)),
    featured:{title:featured.title,description:featured.description,href:url(featured),kind:copy.kinds[kind]},
    foundation:{title:foundation.title,description:foundation.description,href:url(foundation)},
    practiceUrl:en?'/en/practice/':'/lamiglowka/',
    pathUrls:en?['/en/practice/','/en/foundations/','/en/architecture-in-motion/','/en/tools/']:['/lamiglowka/','/podstawy-architektury/','/architektura-w-ruchu/','/narzedzia/'],
    translationUrl:en?'/pl/':'/en/',newsletterUrl:en?'/en/newsletter/':'/newsletter/',
    businessUrl:en?'/en/for-business/':'/dlafirm/',tutorialUrl:en?'/en/architecture-with-ai/':'/architektura-it-ai/',eventsUrl:en?'/en/events/':'/wydarzenia/'
  };
}
