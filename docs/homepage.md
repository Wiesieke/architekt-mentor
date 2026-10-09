# Shared bilingual homepage

`src/components/Homepage.astro` owns all homepage sections and styling. Both `/pl/` and `/en/` render it with a locale prop. `PolishHomepage.astro` is only a compatibility wrapper.

- UI copy: `src/data/homepage-copy.json` (parallel PL/EN keys).
- Content and localized URLs: `src/data/homepage.ts`.
- Editorial index: `src/data/editions.ts`; current date and count are derived.
- Article and exercise translations remain in their existing registries.

The primary CTA opens Practice; the secondary CTA opens `#start`. Both locales have the same four paths, highlighted Practice card, latest edition, starter scenarios, newsletter, pattern/author section, tutorials and events.

When publishing an edition, register the same material in both languages. The EN homepage resolves the current Polish editorial index to its translated article, anti-pattern or exercise. Missing translation is a build error. Do not hardcode the edition date/count, rewrite either route wrapper or introduce another localized layout. Verify both homepages, internal links, language switching and mobile width after changes. Article content remains subject to the publication authorization and quality gate in `docs/editorial-policy.md`.
