import {createHash, generateKeyPairSync, sign} from 'node:crypto';
import {reviewPayload} from '../../src/lib/auditor/core.mjs';

const first = generateKeyPairSync('ed25519');
const second = generateKeyPairSync('ed25519');
export const trustedReviewers = new Map([
  ['synthetic-fixture', first.publicKey], ['synthetic-second', second.publicKey]
]);
export const authorizedReviewers = new Set(['synthetic-fixture', 'synthetic-second']);
export const fixtureOptions = (reviews = []) => ({reviews, trustedReviewers, authorizedReviewers});
export function fixtureReview(claim, flow, overrides = {}, reviewerId = 'synthetic-fixture') {
  const review = {
    claimId:claim.id, reviewerId,
    assessment:{
      kind:'confirmed', status:'confirmed', flow:'confirmed', effect:'confirmed',
      incidentState:claim.incidentState === null ? null : 'confirmed', ...overrides
    }
  };
  const key = reviewerId === 'synthetic-second' ? second.privateKey : first.privateKey;
  return {...review, signature:sign(null, reviewPayload(claim, flow, review), key).toString('base64url')};
}

const payments = 'Przepływ płatności.';
const reporting = 'Przepływ raportowania.';
const delivery = 'Przepływ płatności: broker może dostarczyć ten sam komunikat wielokrotnie.';
const requirement = 'Przepływ płatności: każda operacja musi spowodować dokładnie jedno obciążenie rachunku.';
const protection = 'Przepływ płatności: konsument atomowo zapisuje klucz operacji wraz z obciążeniem i odrzuca ten sam klucz przy ponowieniu.';
const negated = 'Przepływ płatności: konsument obecnie nie deduplikuje operacji.';
const reportingProtection = 'Przepływ raportowania: konsument zapisuje identyfikator raportu i odrzuca duplikaty.';

const duplicateFact = ['payments', 'possible_duplicate_delivery', 'existing', 'HLD', delivery];
const requirementFact = ['payments', 'exactly_once_requirement', 'existing', 'ADR', requirement];
const protectionFact = ['payments', 'protection_documented', 'existing', 'ADR', protection];
const negatedFact = ['payments', 'protection_documented', 'negated', 'ADR', negated];

function scenario({id, description, hld = [delivery], adr = [requirement], facts = [], expected,
  secondFlow = false, assessments = {}, conflicting = false}) {
  const documents = [
    {id:'HLD', version:'1.0', text:[payments, ...(secondFlow ? [reporting] : []), ...hld].join('\n')},
    {id:'ADR', version:'2.1', text:adr.join('\n')}
  ];
  const anchor = (documentId, quote) => {
    const doc = documents.find(d => d.id === documentId);
    const start = doc.text.indexOf(quote);
    if (start < 0 || start !== doc.text.lastIndexOf(quote)) throw new Error('Invalid benchmark quote');
    return {
      documentId, documentVersion:doc.version,
      documentHash:createHash('sha256').update(doc.text).digest('hex'),
      quote, start, end:start + quote.length
    };
  };
  const flows = [{id:'payments', name:'Płatności', ...anchor('HLD', payments)}];
  if (secondFlow) flows.push({id:'reporting', name:'Raportowanie', ...anchor('HLD', reporting)});
  const claims = facts.map(([flowId, kind, status, documentId, quote, effectId = 'charge', incidentState = null], i) => ({
    id:`c${i + 1}`, flowId, effectId, kind, status, incidentState, ...anchor(documentId, quote)
  }));
  const reviews = claims.map(claim => fixtureReview(claim, flows.find(flow => flow.id === claim.flowId),
    assessments[claim.id]));
  if (conflicting) {
    const target = claims.at(-1);
    reviews.push(fixtureReview(target, flows.find(flow => flow.id === target.flowId),
      {status:'partial'}, 'synthetic-second'));
  }
  return {id, description, documents, expectedFacts:{flows, claims}, reviews, expected};
}

const finding = (status, reason, flowId = 'payments', effectId = 'charge') => ({flowId, effectId, status, reason});
const planned = 'Przepływ płatności: w przyszłym kwartale planujemy wdrożyć klucz idempotentności.';
const doubled = 'Przepływ płatności: ponowne dostarczenie spowodowało drugie obciążenie rachunku; problem pozostaje nierozwiązany.';
const resolved = 'Przepływ płatności: w ubiegłym roku ponowienie spowodowało drugie obciążenie; awarię usunięto.';
const historical = 'Przepływ płatności: w ubiegłym roku ponowienie spowodowało drugie obciążenie; stan naprawy jest nieznany.';
const notifications = 'Przepływ płatności: deduplikacja powiadomień e-mail nie obejmuje obciążeń.';
const unclear = 'Przepływ płatności: warstwa ochronna może blokować powtórzenia, ale nie wiadomo, czy obejmuje obciążenie rachunku.';
const noDelivery = 'Przepływ płatności: w rozpatrywanym wariancie dostarczenie duplikatu jest wykluczone.';
const noRequirement = 'Przepływ płatności: jednokrotne obciążenie nie jest wymagane w tym wariancie.';
const transportOnly = 'Przepływ płatności: ADR opisuje wyłącznie gwarancję transportu, bez wymagań dla obciążenia rachunku.';
const facts = [duplicateFact, requirementFact];

export const benchmark = [
  scenario({
    id:'documented-protection', description:'Deduplikacja obejmuje ten sam efekt biznesowy.',
    adr:[requirement, protection], facts:[...facts, protectionFact],
    expected:[finding('PASS', 'DOCUMENTED_PROTECTION')]
  }),
  scenario({
    id:'missing-protection', description:'Obie przesłanki są jawne, ADR milczy o zabezpieczeniu.',
    facts, expected:[finding('NEEDS_REVIEW', 'MISSING_PROTECTION')]
  }),
  scenario({
    id:'planned-protection', description:'Mechanizm jest dopiero w planie.',
    adr:[requirement, planned], facts:[...facts, ['payments', 'protection_documented', 'planned', 'ADR', planned]],
    expected:[finding('NEEDS_REVIEW', 'PLANNED_PROTECTION')]
  }),
  scenario({
    id:'negated-protection', description:'Dokument neguje deduplikację, ale nie stwierdza drugiego obciążenia.',
    adr:[requirement, negated], facts:[...facts, negatedFact],
    expected:[finding('NEEDS_REVIEW', 'NEGATED_PROTECTION')]
  }),
  scenario({
    id:'confirmed-violation', description:'Ponowienie już spowodowało dodatkowy efekt mimo opisu zabezpieczenia.',
    adr:[requirement, protection, doubled],
    facts:[...facts, protectionFact, ['payments', 'duplicate_business_effect', 'existing', 'ADR', doubled, 'charge', 'current_unresolved']],
    expected:[finding('FAIL', 'DUPLICATE_BUSINESS_EFFECT')]
  }),
  scenario({
    id:'unclear-protection', description:'Nie wiadomo, jaki efekt zabezpiecza opisany mechanizm.',
    adr:[requirement, unclear], facts:[...facts, ['payments', 'protection_documented', 'unclear', 'ADR', unclear]],
    expected:[finding('NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE')]
  }),
  scenario({
    id:'other-flow', description:'Zabezpieczenie raportowania nie zabezpiecza płatności.',
    secondFlow:true, adr:[requirement, reportingProtection],
    facts:[...facts, ['reporting', 'protection_documented', 'existing', 'ADR', reportingProtection, 'report']],
    expected:[finding('NEEDS_REVIEW', 'MISSING_PROTECTION'), finding('NEEDS_REVIEW', 'MISSING_PREMISE', 'reporting', 'report')]
  }),
  scenario({
    id:'conflicting-documents', description:'HLD potwierdza, a ADR neguje ten sam mechanizm.',
    hld:[delivery, protection], adr:[requirement, negated],
    facts:[...facts, ['payments', 'protection_documented', 'existing', 'HLD', protection], negatedFact],
    expected:[finding('NEEDS_REVIEW', 'CONFLICTING_EVIDENCE')]
  }),
  scenario({
    id:'missing-business-requirement', description:'Opis transportu nie ustanawia wymagania efektu biznesowego.',
    adr:[transportOnly], facts:[duplicateFact], expected:[finding('NEEDS_REVIEW', 'MISSING_PREMISE')]
  }),
  scenario({
    id:'negated-premise', description:'Dokumentacja jawnie wyklucza duplikaty.',
    hld:[noDelivery], facts:[['payments', 'possible_duplicate_delivery', 'negated', 'HLD', noDelivery], requirementFact],
    expected:[finding('NOT_APPLICABLE', 'NEGATED_PREMISE')]
  }),
  scenario({
    id:'existing-and-planned', description:'HLD opisuje działający klucz, a ADR dopiero planuje go wdrożyć.',
    hld:[delivery, protection], adr:[requirement, planned],
    facts:[...facts, ['payments', 'protection_documented', 'existing', 'HLD', protection],
      ['payments', 'protection_documented', 'planned', 'ADR', planned]],
    expected:[finding('NEEDS_REVIEW', 'CONFLICTING_EVIDENCE')]
  }),
  scenario({
    id:'other-effect', description:'Zabezpieczenie e-maila nie dowodzi zabezpieczenia obciążenia.',
    adr:[requirement, notifications],
    facts:[...facts, ['payments', 'protection_documented', 'existing', 'ADR', notifications, 'email']],
    expected:[finding('NEEDS_REVIEW', 'MISSING_PROTECTION'), finding('NEEDS_REVIEW', 'MISSING_PREMISE', 'payments', 'email')]
  }),
  scenario({
    id:'resolved-incident', description:'Naprawiona awaria bez niezależnego dowodu aktualnego zabezpieczenia.',
    adr:[requirement, resolved],
    facts:[...facts, ['payments', 'duplicate_business_effect', 'existing', 'ADR', resolved, 'charge', 'resolved']],
    expected:[finding('NEEDS_REVIEW', 'NO_CURRENT_PROTECTION_EVIDENCE')]
  }),
  scenario({
    id:'partial-review', description:'Niepełna recenzja zabezpieczenia nie może potwierdzić zgodności.',
    adr:[requirement, protection], facts:[...facts, protectionFact], assessments:{c3:{effect:'partial'}},
    expected:[finding('NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE')]
  }),
  ...['status', 'flow', 'effect', 'kind'].map(dimension => scenario({
    id:`rejected-${dimension}`, description:`Zanegowane zabezpieczenie z odrzuconym wymiarem ${dimension}.`,
    hld:[delivery, protection], adr:[requirement, negated],
    facts:[...facts, ['payments', 'protection_documented', 'existing', 'HLD', protection], negatedFact],
    assessments:{c4:{[dimension]:'unsupported'}},
    expected:[finding('NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE')]
  })),
  scenario({
    id:'rejected-incident-state', description:'Odrzucenie stanu bieżącego incydentu nie może ukryć ryzyka.',
    adr:[requirement, protection, doubled],
    facts:[...facts, protectionFact, ['payments', 'duplicate_business_effect', 'existing', 'ADR', doubled, 'charge', 'current_unresolved']],
    assessments:{c4:{incidentState:'unsupported'}},
    expected:[finding('NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE')]
  }),
  scenario({
    id:'conflicting-reviews', description:'Dwóch uprawnionych recenzentów ocenia ten sam dowód odmiennie.',
    adr:[requirement, protection], facts:[...facts, protectionFact], conflicting:true,
    expected:[finding('NEEDS_REVIEW', 'CONFLICTING_REVIEWS')]
  }),
  scenario({
    id:'historical-unresolved', description:'Historyczna awaria bez potwierdzonej naprawy blokuje PASS.',
    adr:[requirement, protection, historical],
    facts:[...facts, protectionFact, ['payments', 'duplicate_business_effect', 'existing', 'ADR', historical, 'charge', 'historical']],
    expected:[finding('NEEDS_REVIEW', 'HISTORICAL_INCIDENT')]
  }),
  scenario({
    id:'negated-requirement', description:'Jawna negacja wymagania nie potwierdza przesłanki reguły.',
    adr:[noRequirement], facts:[duplicateFact, ['payments', 'exactly_once_requirement', 'negated', 'ADR', noRequirement]],
    expected:[finding('NOT_APPLICABLE', 'NEGATED_PREMISE')]
  }),
  scenario({
    id:'negated-delivery-with-incident', description:'Aktualny incydent jest sprzeczny z negacją dostarczenia duplikatu.',
    hld:[noDelivery], adr:[requirement, doubled],
    facts:[['payments', 'possible_duplicate_delivery', 'negated', 'HLD', noDelivery], requirementFact,
      ['payments', 'duplicate_business_effect', 'existing', 'ADR', doubled, 'charge', 'current_unresolved']],
    expected:[finding('NEEDS_REVIEW', 'CONFLICTING_EVIDENCE')]
  }),
  scenario({
    id:'negated-requirement-with-incident', description:'Aktualny incydent przy zanegowanym wymaganiu wymaga oceny.',
    adr:[noRequirement, doubled],
    facts:[duplicateFact, ['payments', 'exactly_once_requirement', 'negated', 'ADR', noRequirement],
      ['payments', 'duplicate_business_effect', 'existing', 'ADR', doubled, 'charge', 'current_unresolved']],
    expected:[finding('NEEDS_REVIEW', 'UNRESOLVED_REQUIREMENT')]
  })
];
