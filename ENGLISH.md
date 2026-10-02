# Bilingual ArchitectMentor

English is the primary edition at `/en/`. The Polish homepage is `/pl/`; established Polish article, exercise and tool URLs stay where they are. Only `/` selects a language automatically: Vercel Routing Middleware reads the country header and sends PL visitors to `/pl/`, and everyone else to `/en/` with a temporary redirect. An explicit language URL always remains stable, so a reader's choice takes precedence over the country guess. Local/static fallback at `/` goes to English.

The site has two full editorial editions with paired articles, anti-patterns and exercises. English also has the ADR editor, HLD generator, business enquiry form and data notice. The English exercise posts `locale: 'en'` to `/api/evaluate-puzzle`; the server supplies translated scenarios and criteria from `data/puzzle-coach-en.json`. The English HLD client posts `locale: 'en'` to `/api/generate`. The English contact form translates its displayed service name to the existing server's accepted value.

`Studio.astro` renders the document language, switch, self canonical and reciprocal `hreflang` for actual translated pairs. The two homepages also point to `/` as `x-default`. Vercel production builds are indexable and publish both editions in `/sitemap.xml`; previews are noindex. To check this locally, use `VERCEL_ENV=production npm run build`. A normal local build emulates a preview.

## Daily publishing

Publish the Polish and English versions together where the translation is ready. For articles, add content under `src/content/articles/` and `src/content/articles/en/`, then update `src/data/articles.ts` and `src/data/articles-en.ts`. English slugs may differ; `plSlug` links each pair. Keep technology event dates separate from publication dates, verify primary sources, and mark interpretation clearly.

For new two-mode exercises, follow `docs/exercise-template.md`; update `data/starter-exercises.json`, `data/puzzles.json` and `data/puzzle-coach-en.json` with matching criterion IDs. `src/data/puzzles-en.ts` imports starter translations. For anti-patterns, update `data/antywzorce.json` and `src/data/antipatterns-en.ts`. Update both daily homepage lists: `src/data/editions.ts` for Polish and `src/pages/en/index.astro` for English. Add routes to the sitemap when a new route type appears. Check both language links, the mentor output language, forms, downloaded files, and Vercel preview before publishing.

Never invent a translation or attach `hreflang` to a page that has no real counterpart. Preserve anonymity and clearly mark fictional examples.

## Editorial voice

Write in the voice of Wiesław Ejsymont: a practitioner with over 40 years in IT, including more than 20 years in solution and enterprise architecture. He has worked across hardware, networks and programming, and seen IT applied in industry, telecommunications and aviation. Explain a concrete decision, its risk and a way to test it. Use plain language, measured confidence and, occasionally, dry humour or a sharp observation when it clarifies a trade-off. Avoid academic posturing, slogans and technology hype. Do not invent first-person anecdotes or imply personal involvement in a project without a verified basis. Keep hypothetical examples explicit and real experiences maximally anonymous; never disclose confidential employer information. Apply the same editorial standards in Polish and English.
