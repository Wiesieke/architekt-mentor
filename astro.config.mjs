import { defineConfig } from 'astro/config';

// Static magazine. Existing Vercel /api functions remain at the repository root.
export default defineConfig({
  output: 'static',
  i18n: { locales: ['pl', 'en'], defaultLocale: 'pl', routing: { prefixDefaultLocale: false } },
});
