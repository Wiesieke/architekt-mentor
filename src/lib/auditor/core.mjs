import {createHash, KeyObject, verify} from 'node:crypto';

export const CLAIM_KINDS = Object.freeze([
  'possible_duplicate_delivery', 'exactly_once_requirement',
  'protection_documented', 'duplicate_business_effect'
]);
export const CLAIM_STATUSES = Object.freeze(['existing', 'planned', 'negated', 'unclear']);
export const INCIDENT_STATES = Object.freeze(['current_unresolved', 'historical', 'resolved', 'unclear']);

const ID = /^[a-zA-Z0-9_-]{1,40}$/;
const VERSION = /^[a-zA-Z0-9_.-]{1,40}$/;
const anchorFields = ['documentId', 'documentVersion', 'documentHash', 'quote', 'start', 'end'];
const flowFields = ['id', 'name', ...anchorFields];
const claimFields = ['id', 'flowId', 'effectId', 'kind', 'status', 'incidentState', ...anchorFields];
const reviewFields = ['kind', 'status', 'flow', 'effect', 'incidentState'];
const verdicts = ['confirmed', 'partial', 'unsupported'];
const validId = value => typeof value === 'string' && ID.test(value);
export const hashDocument = text => createHash('sha256').update(text, 'utf8').digest('hex');

export function validateDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0 || documents.length > 10) {
    throw new Error('Expected 1–10 documents.');
  }
  const docs = new Map();
  for (const doc of documents) {
    if (!doc || !validId(doc.id) || docs.has(doc.id)
        || typeof doc.version !== 'string' || !VERSION.test(doc.version)
        || typeof doc.text !== 'string' || doc.text.trim().length < 20 || doc.text.length > 30000
        || !doc.text.isWellFormed()) {
      throw new Error('Invalid document id, version, duplicate id, or text size.');
    }
    docs.set(doc.id, {...doc, documentHash:hashDocument(doc.text)});
  }
  return docs;
}

function exactEvidence(docs, item) {
  const doc = docs.get(item.documentId);
  return !!doc && doc.version === item.documentVersion && doc.documentHash === item.documentHash
    && typeof item.quote === 'string'
    && !!item.quote.trim() && Number.isInteger(item.start) && Number.isInteger(item.end)
    && item.start >= 0 && item.start < item.end && item.end <= doc.text.length
    && doc.text.slice(item.start, item.end) === item.quote;
}

export function locateQuote(doc, quote) {
  const start = typeof quote === 'string' && quote.trim() ? doc.text.indexOf(quote) : -1;
  if (start === -1 || doc.text.indexOf(quote, start + 1) !== -1) {
    throw new Error('Expected a unique exact source quote.');
  }
  return {start, end: start + quote.length};
}

export function validateExtraction(documents, extraction) {
  return validateAgainstDocuments(validateDocuments(documents), extraction);
}

function validateAgainstDocuments(docs, extraction) {
  if (!extraction || !Array.isArray(extraction.flows) || !Array.isArray(extraction.claims)
      || extraction.flows.length > 40 || extraction.claims.length > 200) {
    throw new Error('Invalid or oversized extraction.');
  }
  const flows = new Set();
  for (const flow of extraction.flows) {
    if (!flow || !validId(flow.id) || flows.has(flow.id) || typeof flow.name !== 'string'
        || !flow.name.trim() || !exactEvidence(docs, flow)) {
      throw new Error('Invalid flow or unverified flow evidence.');
    }
    flows.add(flow.id);
  }
  const claims = new Set();
  for (const claim of extraction.claims) {
    if (!claim || !validId(claim.id) || claims.has(claim.id) || !flows.has(claim.flowId)
        || !(claim.effectId === null || validId(claim.effectId))
        || !CLAIM_KINDS.includes(claim.kind) || !CLAIM_STATUSES.includes(claim.status)
        || !(claim.kind === 'duplicate_business_effect'
          ? INCIDENT_STATES.includes(claim.incidentState) : claim.incidentState === null)
        || !exactEvidence(docs, claim)) {
      throw new Error('Invalid claim, unknown flow, or unverified claim evidence.');
    }
    claims.add(claim.id);
  }
  return extraction;
}

export function reviewPayload(claim, flow, {reviewerId, assessment}) {
  return Buffer.from(JSON.stringify([
    'architect-mentor/evidence-review/0.2.2', reviewerId,
    claimFields.map(field => claim[field]), flowFields.map(field => flow[field]),
    reviewFields.map(field => assessment[field])
  ]));
}

function reviewedClaims(extraction, {
  reviews = [], trustedReviewers = new Map(), authorizedReviewers = new Set()
} = {}) {
  if (!Array.isArray(reviews) || !(trustedReviewers instanceof Map)
      || !(authorizedReviewers instanceof Set)) {
    throw new Error('Expected reviews, trusted public keys, and caller-authorized reviewers.');
  }
  const claims = new Map(extraction.claims.map(claim => [claim.id, claim]));
  const flows = new Map(extraction.flows.map(flow => [flow.id, flow]));
  const assessments = new Map();
  for (const review of reviews) {
    const claim = claims.get(review?.claimId);
    if (!claim) continue;
    const key = trustedReviewers.get(review.reviewerId);
    const signature = review.signature;
    const assessment = review.assessment;
    const dimensionsValid = assessment && reviewFields.every(field =>
      field === 'incidentState' && claim.incidentState === null
        ? assessment[field] === null : verdicts.includes(assessment[field]));
    const signatureValid = key instanceof KeyObject && key.type === 'public'
      && key.asymmetricKeyType === 'ed25519'
      && typeof signature === 'string' && /^[A-Za-z0-9_-]{86}$/.test(signature)
      && dimensionsValid
      && verify(null, reviewPayload(claim, flows.get(claim.flowId), review), key,
        Buffer.from(signature, 'base64url'));
    if (!signatureValid) {
      if (!assessments.has(claim.id)) assessments.set(claim.id, {reviewStatus:'unverified'});
      continue;
    }
    if (!authorizedReviewers.has(review.reviewerId)) {
      if (!assessments.has(claim.id)) assessments.set(claim.id, {
        reviewStatus:'unverified', signature_valid:true, reviewer_authorized:false
      });
      continue;
    }
    const seen = assessments.get(claim.id);
    if (seen?.reviewStatus === 'conflicting') continue;
    const clean = Object.fromEntries(reviewFields.map(field => [field, assessment[field]]));
    if (seen?.reviewStatus === 'authenticated') {
      if (JSON.stringify(seen.assessment) !== JSON.stringify(clean)) {
        assessments.set(claim.id, {reviewStatus:'conflicting', signature_valid:true,
          reviewer_authorized:true});
      }
      continue;
    }
    assessments.set(claim.id, {
      reviewStatus:'authenticated', signature_valid:true, reviewer_authorized:true,
      reviewerId:review.reviewerId, assessment:clean
    });
  }
  return extraction.claims.map(claim => {
    const review = assessments.get(claim.id) ?? {reviewStatus:'missing'};
    const decisions = Object.values(review.assessment ?? {});
    const completeness = decisions.includes('unsupported') ? 'unsupported'
      : decisions.includes('partial') ? 'partial' : decisions.length ? 'sufficient' : 'unknown';
    const evidenceSufficient = review.reviewStatus === 'authenticated'
      && review.assessment.kind === 'confirmed' && completeness === 'sufficient';
    return {
      ...Object.fromEntries(claimFields.map(key => [key, claim[key]])),
      ...review,
      signature_valid: review.signature_valid ?? false,
      reviewer_authorized: review.reviewer_authorized ?? false,
      evidence_sufficient:evidenceSufficient,
      quality: evidenceSufficient ? 'reviewed' : 'quote_verified',
      completeness
    };
  });
}

function evidenceAnchor(item) {
  return Object.fromEntries(anchorFields.map(key => [key, item[key]]));
}

function makeGraph(documents, flows, claims) {
  const nodes = [
    ...Array.from(documents.values(), d => ({
      id:`doc:${d.id}`, type:'document', label:d.id, version:d.version, documentHash:d.documentHash
    })),
    ...flows.map(f => ({id:`flow:${f.id}`, type:'flow', label:f.name})),
    ...claims.map(c => ({
      id:`claim:${c.id}`, type:'claim', label:c.kind, status:c.status,
      effectId:c.effectId, incidentState:c.incidentState, quality:c.quality,
      completeness:c.completeness, signature_valid:c.signature_valid,
      reviewer_authorized:c.reviewer_authorized, evidence_sufficient:c.evidence_sufficient
    }))
  ];
  const sourceEdge = (item, type) => ({
    from:`${type}:${item.id}`, to:`doc:${item.documentId}`, type:'evidenced_by', anchor:evidenceAnchor(item)
  });
  const edges = [
    ...flows.map(f => sourceEdge(f, 'flow')),
    ...claims.flatMap(c => [
      {from:`claim:${c.id}`, to:`flow:${c.flowId}`, type:'about', quality:c.quality, completeness:c.completeness},
      sourceEdge(c, 'claim')
    ])
  ];
  return {nodes, edges};
}

export function buildGraph(documents, extraction, options) {
  const docs = validateDocuments(documents);
  validateAgainstDocuments(docs, extraction);
  return makeGraph(docs, extraction.flows, reviewedClaims(extraction, options));
}

function decide(evidence) {
  if (evidence.some(c => c.reviewStatus === 'conflicting')) {
    return ['NEEDS_REVIEW', 'CONFLICTING_REVIEWS', 'Uprawnieni recenzenci wydali sprzeczne oceny tego samego dowodu.'];
  }
  const confirmed = evidence.filter(c => c.evidence_sufficient && c.effectId !== null);
  const has = (kind, status) => confirmed.some(c => c.kind === kind && c.status === status);
  const existing = kind => has(kind, 'existing');
  const negated = kind => has(kind, 'negated');
  const [delivery, requirement, protection, effect] = CLAIM_KINDS;
  const hasIncident = state => confirmed.some(c =>
    c.kind === effect && c.status === 'existing' && c.incidentState === state);
  const currentIncident = hasIncident('current_unresolved');
  const incidentStates = new Set(confirmed.filter(c =>
    c.kind === effect && c.status === 'existing').map(c => c.incidentState));
  if (CLAIM_KINDS.some(kind => existing(kind) && negated(kind))
      || (existing(protection) && (has(protection, 'planned') || has(protection, 'unclear')))
      || incidentStates.size > 1
      || (currentIncident && (negated(delivery) || hasIncident('resolved') || hasIncident('historical')))) {
    return ['NEEDS_REVIEW', 'CONFLICTING_EVIDENCE', 'Dokumenty zawierają sprzeczne twierdzenia.'];
  }
  if (evidence.some(c => !c.evidence_sufficient || c.effectId === null
      || c.status === 'unclear' || c.incidentState === 'unclear')) {
    return ['NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE', 'Dowody wymagają weryfikacji lub uzupełnienia.'];
  }
  if (currentIncident && negated(requirement)) {
    return ['NEEDS_REVIEW', 'UNRESOLVED_REQUIREMENT', 'Potwierdzono powtórzenie efektu, ale dokumentacja neguje wymaganie jednokrotności.'];
  }
  if (negated(delivery) || negated(requirement)) {
    return ['NOT_APPLICABLE', 'NEGATED_PREMISE', 'Dokumentacja wyklucza co najmniej jedną przesłankę reguły.'];
  }
  if (!existing(delivery) || !existing(requirement)) {
    return ['NEEDS_REVIEW', 'MISSING_PREMISE', 'Brakuje danych o duplikatach lub wymaganym efekcie biznesowym.'];
  }
  if (currentIncident) {
    return ['FAIL', 'DUPLICATE_BUSINESS_EFFECT', 'Dokumentacja stwierdza aktualny, nierozwiązany przypadek powtórzenia efektu biznesowego.'];
  }
  if (hasIncident('historical')) {
    return ['NEEDS_REVIEW', 'HISTORICAL_INCIDENT', 'Nie potwierdzono usunięcia historycznego incydentu dla tego efektu.'];
  }
  if (existing(protection)) {
    return ['PASS', 'DOCUMENTED_PROTECTION', 'Dokumentacja opisuje istniejące zabezpieczenie; nie potwierdza skuteczności wdrożenia.'];
  }
  if (negated(protection)) {
    return ['NEEDS_REVIEW', 'NEGATED_PROTECTION', 'Dokumentacja neguje zabezpieczenie, ale nie potwierdza powtórzenia efektu.'];
  }
  if (has(protection, 'planned')) {
    return ['NEEDS_REVIEW', 'PLANNED_PROTECTION', 'Zabezpieczenie jest planowane, a nie opisane jako istniejące.'];
  }
  if (hasIncident('historical') || hasIncident('resolved')) {
    return ['NEEDS_REVIEW', 'NO_CURRENT_PROTECTION_EVIDENCE', 'Informacja o dawnym zdarzeniu lub jego naprawie nie potwierdza obecnego zabezpieczenia.'];
  }
  return ['NEEDS_REVIEW', 'MISSING_PROTECTION', 'Nie znaleziono dowodu istniejącego zabezpieczenia.'];
}

function findingsFor(flows, claims) {
  if (flows.length === 0) {
    return [{
      ruleId:'ARCH-001', flowId:null, flowName:null, effectId:null, status:'NEEDS_REVIEW',
      reason:'NO_FLOWS', message:'Nie zidentyfikowano przepływów do oceny.', evidence:[]
    }];
  }
  return flows.flatMap(flow => {
    const local = claims.filter(c => c.flowId === flow.id);
    const effects = [...new Set(local.map(c => c.effectId).filter(id => id !== null))];
    return (effects.length ? effects : [null]).map(effectId => {
      const evidence = local.filter(c => c.effectId === effectId || c.effectId === null);
      // An unconfirmed scope cannot be used to dismiss evidence as belonging elsewhere.
      const unresolvedScope = claims.filter(c => !evidence.includes(c)
        && (c.assessment?.flow !== 'confirmed' || !c.evidence_sufficient
          || (c.flowId === flow.id && c.assessment?.effect !== 'confirmed')));
      const [status, reason, message] = decide([...evidence, ...unresolvedScope]);
      return {
        ruleId:'ARCH-001', flowId:flow.id, flowName:flow.name, effectId, status, reason, message,
        evidence:[...evidence, ...unresolvedScope]
      };
    });
  });
}

export function evaluateIdempotency(documents, extraction, options) {
  validateExtraction(documents, extraction);
  return findingsFor(extraction.flows, reviewedClaims(extraction, options));
}

export function audit(documents, extraction, options) {
  const docs = validateDocuments(documents);
  validateAgainstDocuments(docs, extraction);
  const claims = reviewedClaims(extraction, options);
  return {
    version: '0.2.2',
    graph: makeGraph(docs, extraction.flows, claims),
    findings: findingsFor(extraction.flows, claims),
    limitations: [
      'Only ARCH-001 is implemented.',
      'Missing documentation is not evidence that a safeguard does not exist.',
      'Exact quotations alone cannot establish meaning, flow scope, or extraction coverage.'
    ]
  };
}
