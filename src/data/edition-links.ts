import { latestEditionDate } from './editions';
import { homepageData } from './homepage';

const learningKinds = new Set(['ĆWICZENIE','ANTYWZORZEC','PODSTAWY']);

export function editionLearningLinks(locale: 'pl' | 'en', published: string | undefined, currentHref: string) {
  if (!published || published !== latestEditionDate) return [];
  return homepageData(locale).edition.filter(item => learningKinds.has(item.kind) && item.href !== currentHref);
}
