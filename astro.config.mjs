import { defineConfig } from 'astro/config';
import auditorLab from './src/lib/auditor/lab/integration.mjs';

// Static magazine. Existing Vercel /api functions remain at the repository root.
export default defineConfig({
  output: 'static',
  integrations: [auditorLab],
});
