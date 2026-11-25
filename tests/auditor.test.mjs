import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign, verify} from 'node:crypto';
import {audit, hashDocument, reviewPayload, validateExtraction} from '../src/lib/auditor/core.mjs';
import {extractWithOpenAI} from '../src/lib/auditor/openai-extractor.mjs';
import {benchmark, fixtureOptions, fixtureReview, trustedReviewers, authorizedReviewers} from './fixtures/auditor-benchmark.mjs';

for (const {id, description, documents, expectedFacts, reviews, expected} of benchmark) {
  test(`benchmark: ${id} — ${description}`, () => {
    const report = audit(documents, expectedFacts, fixtureOptions(reviews));
    assert.deepEqual(report.findings.map(({flowId, effectId, status, reason}) => ({flowId, effectId, status, reason})), expected);
    for (const claim of expectedFacts.claims) {
      const finding = report.findings.find(f => f.flowId === claim.flowId && f.effectId === claim.effectId);
      const {assessment, reviewerId, reviewStatus, quality, completeness,
        signature_valid, reviewer_authorized, evidence_sufficient, ...record} =
        finding.evidence.find(c => c.id === claim.id);
      assert.deepEqual(record, claim);
      if (id === 'conflicting-reviews' && claim.id === expectedFacts.claims.at(-1).id) {
        assert.equal(reviewStatus, 'conflicting');
      } else {
        assert.equal(signature_valid, true);
        assert.equal(reviewer_authorized, true);
        assert.equal(evidence_sufficient, Object.values(assessment).every(v => v === null || v === 'confirmed'));
      }
    }
  });
}

const {documents, expectedFacts, reviews} = benchmark[0];
const options = fixtureOptions(reviews);
const payment = expectedFacts.flows[0];
const safeguard = expectedFacts.claims.at(-1);
const withLastClaim = changes => ({
  ...expectedFacts, claims:[...expectedFacts.claims.slice(0, -1), {...expectedFacts.claims.at(-1), ...changes}]
});

test('verified anchors are carried in the graph and refer to the correct version and range', () => {
  const {graph} = audit(documents, expectedFacts, options);
  const {id, flowId, effectId, kind, status, incidentState, ...anchor} = safeguard;
  const {documentId, documentVersion, documentHash, start, end, quote} = anchor;
  const doc = documents.find(d => d.id === documentId);
  assert.equal(doc.text.slice(start, end), quote);
  assert.ok(graph.nodes.some(n => n.id === `doc:${documentId}` && n.version === documentVersion && n.documentHash === documentHash));
  assert.deepEqual(graph.edges.find(e => e.from === `claim:${id}` && e.type === 'evidenced_by'),
    {from:`claim:${id}`, to:`doc:${documentId}`, type:'evidenced_by', anchor});
  assert.ok(graph.edges.some(e => e.from === `claim:${id}` && e.to === `flow:${flowId}` && e.type === 'about'));
});

test('rejects altered quotes, wrong positions and wrong source revisions', () => {
  const {quote, start, end} = expectedFacts.claims.at(-1);
  for (const changes of [{quote:quote.toUpperCase()}, {start:start - 1}, {end:end + 1}, {documentVersion:'99'}, {documentHash:'0'.repeat(64)}]) {
    assert.throws(() => validateExtraction(documents, withLastClaim(changes)), /unverified claim evidence/);
  }
});

test('an extractor cannot approve its own evidence', () => {
  const claimedApproval = withLastClaim({quality:'reviewed', completeness:'sufficient'});
  const {findings:[finding]} = audit(documents, {...claimedApproval, reviews, trustedReviewers},
    {...options, reviews:reviews.slice(0, -1)});
  assert.equal(finding.status, 'NEEDS_REVIEW');
  assert.equal(finding.evidence.at(-1).quality, 'quote_verified');
  assert.equal(finding.evidence.at(-1).completeness, 'unknown');
});

test('a partial review cannot establish protection, and changed claims cannot reuse an old review', () => {
  for (const field of ['kind','status','flow','effect']) {
    const partial = [...reviews.slice(0, -1), fixtureReview(safeguard, payment, {[field]:'partial'})];
    const {findings:[finding]} = audit(documents, expectedFacts, {...options, reviews:partial});
    assert.equal(finding.status, 'NEEDS_REVIEW');
    assert.equal(finding.evidence.at(-1).completeness, 'partial');
  }
  for (const changes of [{status:'planned'},{effectId:'email'}]) {
    const findings = audit(documents, withLastClaim(changes), options).findings;
    assert.ok(findings.every(f => f.status === 'NEEDS_REVIEW'));
    assert.ok(findings[0].evidence.some(c => c.id === safeguard.id && c.reviewStatus === 'unverified'));
  }
  const renamed = {...expectedFacts, flows:[{...expectedFacts.flows[0], name:'Raportowanie'}]};
  assert.equal(audit(documents, renamed, options).findings[0].status, 'NEEDS_REVIEW');
});

test('exact but mislabelled protection does not support a pass', () => {
  for (const id of ['other-flow', 'negated-protection']) {
    const scenario = benchmark.find(item => item.id === id);
    const {flows, claims} = scenario.expectedFacts;
    const badClaim = {...claims.at(-1), flowId:'payments', effectId:'charge', status:'existing'};
    const extraction = {flows, claims:[...claims.slice(0, -1), badClaim]};
    const premiseReviews = scenario.reviews.slice(0, -1);
    const replay = audit(scenario.documents, extraction, fixtureOptions(scenario.reviews)).findings[0];
    assert.equal(replay.status, 'NEEDS_REVIEW');
    assert.equal(replay.evidence.at(-1).reviewStatus, 'unverified');
    const field = id === 'other-flow' ? 'flow' : 'status';
    const checked = [...premiseReviews, fixtureReview(badClaim, flows[0], {[field]:'unsupported'})];
    const result = audit(scenario.documents, extraction, fixtureOptions(checked)).findings[0];
    assert.equal(result.reason, 'UNRESOLVED_EVIDENCE');
    assert.equal(result.evidence.at(-1).quality, 'quote_verified');
  }
});

test('unreviewed duplicate effects cannot establish a documented violation', () => {
  const scenario = benchmark.find(item => item.id === 'confirmed-violation');
  const result = audit(scenario.documents, scenario.expectedFacts, fixtureOptions(scenario.reviews.slice(0, -1)));
  assert.equal(result.findings[0].status, 'NEEDS_REVIEW');
});

test('empty extraction is reported as an evidence gap, not an empty success', () => {
  const {findings} = audit(documents, {flows:[], claims:[]});
  assert.deepEqual(findings.map(({flowId, status, reason}) => [flowId, status, reason]),
    [[null, 'NEEDS_REVIEW', 'NO_FLOWS']]);
});

const mockResponse = value => Response.json({
  status:'completed', output:[{content:[{type:'output_text', text:JSON.stringify(value)}]}]
});

test('OpenAI adapter uses versioned input and derives offsets without trusting model approval', async () => {
  const fromProvider = ({start, end, documentHash, ...rest}) => rest;
  const payload = {
    flows:expectedFacts.flows.map(fromProvider),
    effects:[{...fromProvider(expectedFacts.flows[0]), id:'charge', name:'Obciążenie', flowId:'payments'}],
    claims:expectedFacts.claims.map(c => ({...fromProvider(c), start:999, documentHash:'forged', quality:'reviewed'})),
    reviews
  };
  const parsed = await extractWithOpenAI(documents, {apiKey:'test-key', fetchImpl:async (_url, opts) => {
    const request = JSON.parse(opts.body);
    assert.equal(request.store, false);
    assert.equal(request.text.format.type, 'json_schema');
    assert.deepEqual(JSON.parse(request.input), documents);
    return mockResponse(payload);
  }});
  assert.deepEqual({flows:parsed.flows, claims:parsed.claims}, expectedFacts);
  assert.deepEqual(parsed.usage, {model:null, inputTokens:null, outputTokens:null});
  assert.equal(parsed.effects[0].id, 'charge');
  assert.equal(audit(documents, parsed).findings[0].status, 'NEEDS_REVIEW');
});

test('changing text outside the quote invalidates old approvals at the same document version', () => {
  for (const source of documents) {
    const edited = {...source, text:`${source.text}\nKorekta: opisany wariant wymaga ponownego przeglądu.`};
    const changed = documents.map(doc => doc.id === source.id ? edited : doc);
    assert.throws(() => audit(changed, expectedFacts, options), /unverified .* evidence/);
    const reanchor = item => item.documentId === source.id ? {...item, documentHash:hashDocument(edited.text)} : item;
    const extraction = {flows:expectedFacts.flows.map(reanchor), claims:expectedFacts.claims.map(reanchor)};
    const [finding] = audit(changed, extraction, options).findings;
    assert.equal(finding.status, 'NEEDS_REVIEW');
    assert.equal(finding.evidence.find(c => c.id === safeguard.id).reviewStatus, 'unverified');
  }
});

test('unsigned, unknown-key and tampered reviews are not trusted', () => {
  const {privateKey} = generateKeyPairSync('ed25519');
  const genuine = reviews.at(-1);
  const impersonator = {...genuine, reviewer:{type:'human'}, signature:undefined};
  const forged = {...genuine, signature:sign(null, reviewPayload(safeguard, payment, genuine), privateKey).toString('base64url')};
  const partial = fixtureReview(safeguard, payment, {effect:'partial'});
  const tampered = {...partial, assessment:genuine.assessment};
  for (const invalid of [impersonator, forged, tampered]) {
    const [finding] = audit(documents, expectedFacts, {...options, reviews:[...reviews.slice(0, -1), invalid]}).findings;
    assert.equal(finding.status, 'NEEDS_REVIEW');
    assert.equal(finding.evidence.at(-1).reviewStatus, 'unverified');
  }
  const [unconfigured] = audit(documents, expectedFacts, {reviews}).findings;
  assert.equal(unconfigured.status, 'NEEDS_REVIEW');
  assert.equal(unconfigured.evidence.at(-1).reviewStatus, 'unverified');
});

test('an existing safeguard conflicts with a reviewed unclear status for the same effect', () => {
  const scenario = benchmark.find(item => item.id === 'existing-and-planned');
  const {claims, flows} = scenario.expectedFacts;
  const unclear = {...claims.at(-1), status:'unclear'};
  const [finding] = audit(scenario.documents, {flows, claims:[...claims.slice(0, -1), unclear]},
    fixtureOptions([...scenario.reviews.slice(0, -1), fixtureReview(unclear, flows[0])])).findings;
  assert.equal(finding.status, 'NEEDS_REVIEW');
  assert.equal(finding.reason, 'CONFLICTING_EVIDENCE');
});

test('an explicit current safeguard is independent of historical or resolved incidents; unclear remains open', () => {
  const scenario = benchmark.find(item => item.id === 'confirmed-violation');
  const {claims, flows} = scenario.expectedFacts;
  // Change the underlying text as well as the annotations.
  const sentence = {
    historical:'Incydent sprzed roku: ponowienie spowodowało drugie obciążenie.',
    resolved:'Incydent sprzed roku: ponowienie spowodowało drugie obciążenie, usterkę już usunięto.',
    unclear:'Raport stwierdza drugie obciążenie po ponowieniu, lecz jego aktualny stan jest nieznany.'
  };
  for (const [incidentState, text] of Object.entries(sentence)) {
    const original = claims.at(-1);
    const edited = scenario.documents.map(doc => doc.id !== original.documentId ? doc
      : {...doc, text:doc.text.slice(0, original.start) + text});
    const doc = edited.find(doc => doc.id === original.documentId);
    const hash = hashDocument(doc.text);
    const revised = claims.slice(0, -1).map(c => c.documentId === doc.id ? {...c, documentHash:hash} : c);
    revised.push({...original, incidentState, documentHash:hash, quote:text, end:original.start + text.length});
    const reviewSet = revised.map(c => fixtureReview(c, flows[0]));
    const [finding] = audit(edited, {flows, claims:revised}, fixtureOptions(reviewSet)).findings;
    assert.equal(finding.status, incidentState === 'resolved' ? 'PASS' : 'NEEDS_REVIEW');
  }
});

test('conflicting incident histories are visible rather than silently treated as resolved', () => {
  const scenario = benchmark.find(item => item.id === 'historical-unresolved');
  const sentence = 'Ponowne obciążenie z ubiegłego roku zostało naprawione.';
  const documents = scenario.documents.map(doc => doc.id === 'ADR'
    ? {...doc, text:`${doc.text}\n${sentence}`} : doc);
  const adr = documents.find(doc => doc.id === 'ADR');
  const claims = scenario.expectedFacts.claims.map(claim => claim.documentId === 'ADR'
    ? {...claim, documentHash:hashDocument(adr.text)} : claim);
  claims.push({
    ...claims.at(-1), id:'resolved-report', incidentState:'resolved', quote:sentence,
    start:adr.text.indexOf(sentence), end:adr.text.length
  });
  const flows = scenario.expectedFacts.flows;
  const reviews = claims.map(claim => fixtureReview(claim, flows[0]));
  const [finding] = audit(documents, {flows, claims}, fixtureOptions(reviews)).findings;
  assert.equal(finding.status, 'NEEDS_REVIEW');
  assert.equal(finding.reason, 'CONFLICTING_EVIDENCE');
  assert.deepEqual(finding.evidence.filter(c => c.kind === 'duplicate_business_effect')
    .map(c => c.incidentState), ['historical', 'resolved']);
});

test('OpenAI adapter refuses to guess which of two identical source quotes was cited', async () => {
  const repeated = {...documents[0], text:`${documents[0].text}\n${expectedFacts.flows[0].quote}`};
  await assert.rejects(() => extractWithOpenAI([repeated, documents[1]], {
    apiKey:'test-key', fetchImpl:async () => mockResponse({...expectedFacts, effects:[]})
  }), /unique exact source quote/);
});

test('a valid signature alone does not authorize or establish sufficient evidence', () => {
  const signed = audit(documents, expectedFacts, {reviews, trustedReviewers});
  const record = signed.findings[0].evidence.at(-1);
  assert.equal(record.signature_valid, true);
  assert.equal(record.reviewer_authorized, false);
  assert.equal(record.evidence_sufficient, false);
  assert.equal(signed.findings[0].status, 'NEEDS_REVIEW');
  const partial = fixtureReview(safeguard, payment, {effect:'partial'});
  const assessed = audit(documents, expectedFacts,
    fixtureOptions([...reviews.slice(0, -1), partial]));
  assert.equal(assessed.findings[0].evidence.at(-1).signature_valid, true);
  assert.equal(assessed.findings[0].evidence.at(-1).reviewer_authorized, true);
  assert.equal(assessed.findings[0].evidence.at(-1).evidence_sufficient, false);
});

test('identical signed reviews are idempotent; competing authorized reviews are reported', () => {
  const same = audit(documents, expectedFacts, fixtureOptions([...reviews, reviews.at(-1)]));
  assert.equal(same.findings[0].status, 'PASS');
  const second = fixtureReview(safeguard, payment, {status:'partial'}, 'synthetic-second');
  for (const ordered of [[...reviews, second], [second, ...reviews]]) {
    const report = audit(documents, expectedFacts, fixtureOptions(ordered));
    assert.equal(report.findings[0].status, 'NEEDS_REVIEW');
    assert.equal(report.findings[0].reason, 'CONFLICTING_REVIEWS');
    assert.equal(report.findings[0].evidence.at(-1).reviewStatus, 'conflicting');
  }
  const agree = fixtureReview(safeguard, payment, {}, 'synthetic-second');
  assert.equal(audit(documents, expectedFacts, fixtureOptions([...reviews, agree]))
    .findings[0].status, 'PASS');
  const other = benchmark.find(s => s.id === 'other-flow');
  const conflict = fixtureReview(other.expectedFacts.claims.at(-1),
    other.expectedFacts.flows[1], {effect:'partial'}, 'synthetic-second');
  const results = audit(other.documents, other.expectedFacts,
    fixtureOptions([...other.reviews, conflict])).findings;
  assert.equal(results[0].reason, 'CONFLICTING_REVIEWS');
  assert.equal(results[1].reason, 'CONFLICTING_REVIEWS');
});

test('a wrong effect label, rejected status or incident state cannot hide adverse evidence', () => {
  const conflicting = benchmark.find(s => s.id === 'conflicting-documents');
  const {flows, claims} = conflicting.expectedFacts;
  for (const field of ['kind','status','flow','effect']) {
    const mislabeled = {...claims.at(-1), effectId:'email'};
    const extraction = {flows, claims:[...claims.slice(0, -1), mislabeled]};
    const reviewed = [...conflicting.reviews.slice(0, -1),
      fixtureReview(mislabeled, flows[0], {[field]:'unsupported'})];
    const finding = audit(conflicting.documents, extraction, fixtureOptions(reviewed))
      .findings.find(f => f.effectId === 'charge');
    assert.equal(finding.status, 'NEEDS_REVIEW', field);
    assert.equal(finding.reason, 'UNRESOLVED_EVIDENCE', field);
  }
  const incident = benchmark.find(s => s.id === 'confirmed-violation');
  const revised = [...incident.reviews.slice(0, -1),
    fixtureReview(incident.expectedFacts.claims.at(-1), incident.expectedFacts.flows[0],
      {incidentState:'unsupported'})];
  const finding = audit(incident.documents, incident.expectedFacts, fixtureOptions(revised)).findings[0];
  assert.equal(finding.status, 'NEEDS_REVIEW');
  assert.equal(finding.reason, 'UNRESOLVED_EVIDENCE');
});

test('independent signing vector binds every decision field', async t => {
  const claim = safeguard;
  const flow = payment;
  const assessment = {kind:'confirmed', status:'confirmed', flow:'confirmed', effect:'confirmed',
    incidentState:null};
  const {privateKey, publicKey} = generateKeyPairSync('ed25519');
  const payload = (c, f, reviewerId, a) => Buffer.from(JSON.stringify([
    'architect-mentor/evidence-review/0.2.2', reviewerId,
    [c.id, c.flowId, c.effectId, c.kind, c.status, c.incidentState, c.documentId,
      c.documentVersion, c.documentHash, c.quote, c.start, c.end],
    [f.id, f.name, f.documentId, f.documentVersion, f.documentHash, f.quote, f.start, f.end],
    [a.kind, a.status, a.flow, a.effect, a.incidentState]
  ]));
  const signed = sign(null, payload(claim, flow, 'fixture-reviewer', assessment), privateKey);
  assert.deepEqual(reviewPayload(claim, flow, {reviewerId:'fixture-reviewer', assessment}),
    payload(claim, flow, 'fixture-reviewer', assessment));
  const fields = {
    claim:['id','flowId','effectId','kind','status','incidentState','documentId','documentVersion',
      'documentHash','quote','start','end'],
    flow:['id','name','documentId','documentVersion','documentHash','quote','start','end'],
    assessment:['kind','status','flow','effect','incidentState']
  };
  for (const [part, names] of Object.entries(fields)) {
    for (const field of names) {
      await t.test(`${part}.${field}`, () => {
        const c = {...claim}, f = {...flow}, a = {...assessment};
        const target = {claim:c, flow:f, assessment:a}[part];
        target[field] = typeof target[field] === 'number' ? target[field] + 1
          : target[field] === null ? 'confirmed' : `${target[field]}_modified`;
        assert.equal(verify(null, reviewPayload(c, f, {reviewerId:'fixture-reviewer', assessment:a}),
          publicKey, signed), false);
      });
    }
  }
  await t.test('reviewerId', () => {
    assert.equal(verify(null, reviewPayload(claim, flow, {
      reviewerId:'another-reviewer', assessment
    }), publicKey, signed), false);
  });
});
