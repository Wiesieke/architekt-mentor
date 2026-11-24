/** Domain logic for the first ArchitectMentor neuro-symbolic auditor PoC.
 * This module is intentionally provider-independent and has no I/O.
 */
const CLAIM_TYPES = new Set([
  'possible_duplicate_delivery',
  'exactly_once_requirement',
  'protection_documented'
]);

function normalized(value) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function evidenceExists(documentsById, item) {
  const doc = documentsById.get(item.documentId);
  return !!doc && normalized(doc.text).includes(normalized(item.quote));
}

export function validateDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0 || documents.length > 10) {
    throw new Error('Expected 1–10 documents.');
  }
  const ids = new Set();
  for (const doc of documents) {
    if (!doc || typeof doc.id !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(doc.id)
        || ids.has(doc.id) || typeof doc.text !== 'string'
        || doc.text.trim().length < 20 || doc.text.length > 30000) {
      throw new Error('Invalid document id, duplicate id, or text size.');
    }
    ids.add(doc.id);
  }
  return new Map(documents.map(doc => [doc.id, doc]));
}

export function validateExtraction(documents, extraction) {
  const docs = validateDocuments(documents);
  if (!extraction || !Array.isArray(extraction.flows) || !Array.isArray(extraction.claims)
      || extraction.flows.length > 40 || extraction.claims.length > 200) {
    throw new Error('Invalid or oversized extraction.');
  }
  const flows = new Map();
  for (const flow of extraction.flows) {
    if (!flow || typeof flow.id !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(flow.id)
        || flows.has(flow.id) || typeof flow.name !== 'string' || !flow.name.trim()
        || typeof flow.documentId !== 'string' || typeof flow.quote !== 'string'
        || !flow.quote.trim() || !evidenceExists(docs, flow)) {
      throw new Error('Invalid flow or unverified flow evidence.');
    }
    flows.set(flow.id, flow);
  }
  const claims = new Set();
  for (const claim of extraction.claims) {
    if (!claim || typeof claim.id !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(claim.id)
        || claims.has(claim.id) || !flows.has(claim.flowId)
        || !CLAIM_TYPES.has(claim.kind) || typeof claim.documentId !== 'string'
        || typeof claim.quote !== 'string' || !claim.quote.trim()
        || !evidenceExists(docs, claim)) {
      throw new Error('Invalid claim, unknown flow, or unverified claim evidence.');
    }
    claims.add(claim.id);
  }
  return extraction;
}

export function buildGraph(documents, extraction) {
  validateExtraction(documents, extraction);
  const nodes = [
    ...documents.map(d => ({id:`doc:${d.id}`, type:'document', label:d.id})),
    ...extraction.flows.map(f => ({id:`flow:${f.id}`, type:'flow', label:f.name})),
    ...extraction.claims.map(c => ({id:`claim:${c.id}`, type:'claim', label:c.kind}))
  ];
  const edges = [
    ...extraction.flows.map(f => ({from:`flow:${f.id}`, to:`doc:${f.documentId}`, type:'evidenced_by'})),
    ...extraction.claims.flatMap(c => [
      {from:`claim:${c.id}`, to:`flow:${c.flowId}`, type:'about'},
      {from:`claim:${c.id}`, to:`doc:${c.documentId}`, type:'evidenced_by'}
    ])
  ];
  return {nodes, edges};
}

export function evaluateIdempotency(documents, extraction) {
  validateExtraction(documents, extraction);
  if (extraction.flows.length === 0) {
    return [{
      ruleId: 'ARCH-001', flowId: null, flowName: null, status: 'NEEDS_REVIEW',
      message: 'Nie wyodrębniono żadnego przepływu. Audyt nie mógł ocenić reguły; sprawdź kompletność ekstrakcji.',
      evidence: []
    }];
  }
  return extraction.flows.map(flow => {
    const claims = extraction.claims.filter(c => c.flowId === flow.id);
    const repeated = claims.find(c => c.kind === 'possible_duplicate_delivery');
    const once = claims.find(c => c.kind === 'exactly_once_requirement');
    const mechanisms = claims.filter(c => c.kind === 'protection_documented');
    let status, message;
    // In PoC 0.1 the LLM's claim classification is NOT independently
    // verified for polarity, tense or the correct business flow. A quote
    // that happens to exist cannot establish a successful control.
    if (repeated && once && mechanisms.length === 0) {
      status = 'NEEDS_REVIEW';
      message = 'Wymóg jednokrotnego efektu i możliwe duplikaty są udokumentowane, ale nie wskazano zabezpieczenia. Należy zweryfikować projekt.';
    } else if (repeated && once && mechanisms.length > 0) {
      status = 'NEEDS_REVIEW';
      message = 'Znaleziono wzmiankę o zabezpieczeniu; trzeba niezależnie potwierdzić, że jest ono stosowane w tym przepływie, a cytat nie dotyczy planu, negacji lub innego systemu.';
    } else if (claims.length === 0 || repeated || once) {
      status = 'NEEDS_REVIEW';
      message = 'Brak kompletu przesłanek do oceny ARCH-001. Nie oznacza to, że kontrola nie jest potrzebna.';
    } else {
      status = 'NOT_APPLICABLE';
      message = 'Nie znaleziono przesłanek tej reguły w zweryfikowanych dowodach; nie jest to potwierdzenie zgodności całej architektury.';
    }
    return {
      ruleId: 'ARCH-001', flowId: flow.id, flowName: flow.name, status, message,
      evidence: [repeated, once, ...mechanisms].filter(Boolean).map(c => ({
        claimId:c.id, kind:c.kind, documentId:c.documentId, quote:c.quote
      }))
    };
  });
}

export function audit(documents, extraction) {
  return {
    version: '0.1',
    graph: buildGraph(documents, extraction),
    findings: evaluateIdempotency(documents, extraction),
    limitations: [
      'Only ARCH-001 is implemented.',
      'Missing documentation is not evidence that a safeguard does not exist.',
      'Source quotations are checked, but their meaning, polarity and flow assignment remain unverified.',
      'PoC 0.1 intentionally does not emit PASS without independent evidence validation.'
    ]
  };
}
