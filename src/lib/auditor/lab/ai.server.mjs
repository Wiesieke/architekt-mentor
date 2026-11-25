import {audit, validateDocuments} from '../core.mjs';
import {DEFAULT_OPENAI_MODEL, extractWithOpenAI, OpenAIExtractionError} from '../openai-extractor.mjs';
import {AI_MAX_DOC_UNITS, AI_MAX_INPUT_BYTES, AI_MAX_REQUEST_BYTES, AI_OPERATOR_HEADER} from './ai-contract.mjs';
import {isLocalRequest, localHeaders} from './local.server.mjs';
import {getOperatorSession} from './operator.server.mjs';

export const prerender = false;

const failure = (status, error) => Response.json({error}, {status, headers:localHeaders});
const record = (value, keys) => value && typeof value === 'object'
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export function requestedAiModel(env = process.env) {
  const model = env.AUDITOR_AI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  return /^(?:gpt-[a-zA-Z0-9][a-zA-Z0-9.-]{0,79}|o[1-9][a-zA-Z0-9.-]{0,79})$/.test(model)
    && model !== env.OPENAI_API_KEY?.trim() ? model : null;
}

export function aiAvailability(env = process.env, operator = getOperatorSession()) {
  if (env.AUDITOR_AI_ENABLED !== '1') return 'disabled';
  if (!env.OPENAI_API_KEY?.trim()) return 'missing-key';
  if (!operator) return 'missing-operator';
  return requestedAiModel(env) ? 'ready' : 'invalid-model';
}

async function readJson(request) {
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > AI_MAX_REQUEST_BYTES)) return null;
  if (!request.body) throw new SyntaxError('Missing request body.');
  const reader = request.body.getReader();
  const buffer = new Uint8Array(AI_MAX_REQUEST_BYTES);
  let offset = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      if (offset + value.byteLength > buffer.length) {
        void reader.cancel().catch(() => {});
        return null;
      }
      buffer.set(value, offset);
      offset += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  return {payload:JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(buffer.subarray(0, offset)))};
}

export async function handleAiRequest({request, url, clientAddress}, {
  dev, env = process.env, fetchImpl, operator = getOperatorSession()
} = {}) {
  if (!dev || !isLocalRequest(request, url, clientAddress)
      || request.headers.get('origin') !== url.origin
      || request.headers.get('sec-fetch-site') !== 'same-origin'
      || request.headers.get('x-auditor-lab') !== '1') {
    return failure(404, 'Niedostępny adres laboratorium.');
  }
  if (url.search) return failure(400, 'Nie przekazuj parametrów w adresie analizy.');
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
      || request.headers.has('content-encoding')) {
    return failure(415, 'Wymagany jest nieskompresowany JSON.');
  }
  const availability = aiAvailability(env, operator);
  if (availability === 'disabled') return failure(503, 'Analiza AI jest wyłączona (AUDITOR_AI_ENABLED).');
  if (availability === 'missing-key') return failure(503, 'Brak klucza OpenAI w środowisku serwera.');
  if (availability === 'missing-operator') return failure(503, 'Uruchom serwer eksperymentalny z sekretem operatora.');
  if (availability === 'invalid-model') return failure(503, 'Nieprawidłowa nazwa modelu OpenAI.');
  if (!operator.authorizes(request.headers.get(AI_OPERATOR_HEADER))) {
    return failure(403, 'Brak poprawnego sekretu operatora.');
  }

  let input;
  try { input = await readJson(request); } catch {
    return failure(400, 'Nie można odczytać żądania JSON w UTF-8.');
  }
  if (!input) return failure(413, 'Przekroczono limit rozmiaru żądania.');
  const {payload} = input;
  if (payload?.consent !== true) return failure(400, 'Wymagana jest zgoda na przesłanie dokumentów do OpenAI.');
  if (!record(payload, ['consent', 'documents']) || !Array.isArray(payload.documents)
      || payload.documents.length !== 2
      || !payload.documents.every(doc => record(doc, ['id', 'version', 'text']) && typeof doc.text === 'string')
      || !['HLD', 'ADR'].every(id => payload.documents.some(doc => doc.id === id))) {
    return failure(400, 'Oczekiwano jednego HLD i jednego ADR z oznaczeniem wersji.');
  }
  const {documents} = payload;
  if (documents.some(doc => doc.text.length > AI_MAX_DOC_UNITS)
      || documents.reduce((sum, doc) => sum + Buffer.byteLength(doc.text), 0) > AI_MAX_INPUT_BYTES) {
    return failure(413, 'Przekroczono limit dokumentów w trybie AI.');
  }
  try { validateDocuments(documents); } catch {
    return failure(400, 'Sprawdź wersje, długość i kodowanie dokumentów.');
  }
  if (request.signal.aborted) return failure(400, 'Przerwano żądanie przed uruchomieniem analizy.');
  if (!operator.consume()) {
    return failure(429, 'Wykorzystano limit jednego wywołania. Nowa próba wymaga świadomego restartu procesu eksperymentalnego.');
  }
  const started = performance.now();
  try {
    const {flows, effects, claims, usage} = await extractWithOpenAI(documents, {
      apiKey:env.OPENAI_API_KEY.trim(), model:requestedAiModel(env),
      fetchImpl, signal:request.signal
    });
    // Neither the provider nor the request supplies reviews, keys or authorizations.
    const report = audit(documents, {flows, claims});
    return Response.json({
      mode:'ai-experimental', preliminary:true, extraction:{flows, effects, claims}, report,
      usage:{...usage, durationMs:Math.round(performance.now() - started), cost:null}
    }, {headers:localHeaders});
  } catch (error) {
    if (error instanceof OpenAIExtractionError) {
      if (error.code === 'invalid-evidence') return failure(502, `Odrzucono ekstrakcję: ${error.message}`);
      if (error.code === 'provider-size') return failure(502, 'Odpowiedź OpenAI przekroczyła limit rozmiaru.');
      if (error.code === 'provider-output') return failure(502, 'OpenAI nie zwrócił kompletnej ustrukturyzowanej odpowiedzi.');
      return failure(502, error.message);
    }
    if (error.name === 'TimeoutError') return failure(504, 'Przekroczono czas oczekiwania na OpenAI.');
    if (error.name === 'AbortError') return failure(502, 'Przerwano analizę AI.');
    return failure(502, 'Nie udało się wykonać analizy AI. Nie ponowiono wywołania.');
  }
}

export function POST(context) {
  return handleAiRequest(context, {dev:import.meta.env.DEV});
}

export function ALL() {
  return new Response(null, {status:405, headers:{...localHeaders, Allow:'POST'}});
}
