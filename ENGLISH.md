# English edition

The Polish site keeps its existing URLs. The English editorial edition lives under `/en/` and contains the homepage, both article archives and the English versions of all 11 current articles. Interactive exercises, the HLD and ADR tools, the business form and the data notice currently remain in Polish; English navigation links only to translated pages or the contact email.

`astro.config.mjs` uses `pl` as the default locale without a URL prefix. `Studio.astro` renders the language switch, page language, canonical and reciprocal `hreflang` links for translated pairs. The switch on a Polish page without a translation opens the English homepage. In previews, the site still has `noindex,nofollow`.

When adding an editorial article, create the Polish content in `src/content/articles/`, its English counterpart in `src/content/articles/en/`, and add both entries in `src/data/articles.ts` and `src/data/articles-en.ts`. The English entry has its own URL slug and a `plSlug` pointing to its Polish counterpart. Keep the event date separate from the publication date; do not invent a publication date for historical content. Check sources and terminology before publishing a translation. The sitemap uses both lists and `hreflang` appears only on real pairs.

If an article is published in only one language, avoid creating an empty translation or a language alternate for it. Extend the English edition to exercises and tools only when the forms, validation, AI output, privacy text and download formats all use the selected language.
