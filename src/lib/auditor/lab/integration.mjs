import {fileURLToPath} from 'node:url';

const route = '/narzedzia/auditor-lab';
export const reportPath = `${route}/demo.json`;

export default {
  name: 'architectmentor-auditor-lab',
  hooks: {
    'astro:config:setup': ({command, config, injectRoute, updateConfig}) => {
      if (command !== 'dev') return;
      updateConfig({vite: {server: {fs: {deny: [
        // Vite replaces its default deny list when this field is configured.
        '.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
        '.dev.vars', '.dev.vars.*',
        '**/auditor-benchmark.mjs', '**/auditor.test.mjs', '**/auditor-poc-demo.mjs',
        '**/auditor/core.mjs', '**/auditor/openai-extractor.mjs', '**/lab/*.server.mjs'
      ]}}}});
      if (![false, 'localhost', '127.0.0.1', '::1'].includes(config.server.host)) return;
      const inject = (pattern, entry) =>
        injectRoute({pattern, entrypoint:fileURLToPath(new URL(entry, import.meta.url)), prerender:false});
      inject(route, './Page.astro');
      inject(reportPath, './demo.server.mjs');
    }
  }
};
