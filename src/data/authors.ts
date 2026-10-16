import translations from './homepage-copy.json';

// Stable identities: never invent individual author names or claim unverified review.
export interface AuthorProfile {
  id: string;
  kind: 'Person' | 'Organization';
  name: string;
  role: { pl: string; en: string };
  summary: { pl: string; en: string };
  bio: { pl: string; en: string };
}
export const authors = {
  'wieslaw-ejsymont': {
    id: 'wieslaw-ejsymont', kind: 'Person', name: 'Wiesław Ejsymont',
    role: { pl: 'Założyciel ArchitectMentor', en: 'Founder of ArchitectMentor' },
    summary: {
      pl: 'Ponad 40 lat doświadczenia w IT, w tym ponad 20 lat w architekturze rozwiązań i architekturze korporacyjnej.',
      en: 'Over 40 years in IT, including more than 20 years in solution and enterprise architecture.'
    },
    bio: { pl: translations.pl.bio, en: translations.en.bio }
  },
  architectmentor: {
    id: 'architectmentor', kind: 'Organization', name: 'ArchitectMentor',
    role: { pl: 'Publikacje redakcyjne', en: 'Editorial publications' },
    summary: {
      pl: 'Materiały publikowane pod marką ArchitectMentor bez przypisywania ich konkretnej osobie.',
      en: 'Materials published under the ArchitectMentor brand without attributing them to a specific person.'
    },
    bio: {
      pl: 'To profil wydawcy, a nie fikcyjnego autora. Materiały przechodzą kontrole zgodnie z publicznymi zasadami redakcyjnymi. Tam, gdzie możliwe jest potwierdzenie indywidualnego autorstwa, publikacja odsyła do profilu konkretnej osoby.',
      en: 'This is a publisher profile, not a fictitious person. Materials follow the public editorial policy. Where individual authorship is verified, the publication links to the relevant person.'
    }
  }
} satisfies Record<string, AuthorProfile>;
export type AuthorId = keyof typeof authors;
export function resolveAuthor(id: string | undefined): AuthorProfile {
  const key = id ?? 'architectmentor';
  const author = (authors as Record<string, AuthorProfile>)[key];
  if (!author) throw new Error(`Unknown ArchitectMentor author: ${key}`);
  return author;
}
export function authorUrl(id: string, locale: 'pl' | 'en'): string {
  resolveAuthor(id);
  return locale === 'pl' ? `/autorzy/${id}/` : `/en/authors/${id}/`;
}
export function authorSchema(id: string, locale: 'pl' | 'en') {
  const author = resolveAuthor(id);
  return { '@type': author.kind, name: author.name, url: new URL(authorUrl(id, locale), 'https://ejsymont.com').href };
}
