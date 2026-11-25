import {readFileSync} from 'node:fs';
import {dev} from 'astro';
import {initializeOperatorSession} from '../src/lib/auditor/lab/operator.server.mjs';

try {
  if (process.env.AUDITOR_AI_ENABLED !== '1' || !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('Ustaw AUDITOR_AI_ENABLED=1 i klucz OpenAI w środowisku serwera.');
  }
  if (process.stdin.isTTY) throw new Error('Przekaż sekret operatora na stdin zgodnie z instrukcją laboratorium.');
  const input = readFileSync(0);
  try { initializeOperatorSession(input.toString('utf8').trimEnd()); }
  finally { input.fill(0); }
  await dev({server:{host:'127.0.0.1'}, devToolbar:{enabled:false}});
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
