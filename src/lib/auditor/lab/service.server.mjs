import {audit, validateDocuments} from '../core.mjs';
import {benchmark, fixtureOptions} from '../../../../tests/fixtures/auditor-benchmark.mjs';

export const examples = [
  {id:'documented-protection', label:'Ochrona przed podwójnym obciążeniem'},
  {id:'missing-protection', label:'Brak opisu zabezpieczenia'},
  {id:'confirmed-violation', label:'Potwierdzone podwójne obciążenie'},
  {id:'negated-premise', label:'Brak przesłanki do oceny'},
  {id:'other-flow', label:'Zabezpieczenie innego przepływu'},
  {id:'rejected-effect', label:'Niepotwierdzony zakres dowodu'}
];

export const localHeaders = {
  'Cache-Control':'no-store',
  'X-Robots-Tag':'noindex, nofollow',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer'
};

export function isLocalRequest(request, url, address) {
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  return loopback.includes(address)
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    && request.headers.get('host') === url.host
    && ![...request.headers.keys()].some(name => name === 'forwarded' || name.startsWith('x-forwarded-'))
    && (!request.headers.has('origin') || request.headers.get('origin') === url.origin)
    && !['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site'));
}

export function runDemo(id) {
  if (!examples.some(example => example.id === id)) return null;
  const {description, documents, expectedFacts, reviews} = benchmark.find(example => example.id === id);
  return {
    mode:'synthetic-demo',
    example:{id, description},
    documents,
    report:audit(documents, expectedFacts, fixtureOptions(reviews))
  };
}

// Future server-side host binds a provider (e.g. extractWithOpenAI). Model output never supplies reviews.
export async function auditWithExtractor(documents, extract) {
  validateDocuments(documents);
  const extraction = await extract(documents);
  return audit(documents, extraction);
}
