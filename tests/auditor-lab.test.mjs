import assert from 'node:assert/strict';
import test from 'node:test';
import {dev} from 'astro';
import {extractWithOpenAI} from '../src/lib/auditor/openai-extractor.mjs';
import integration, {reportPath} from '../src/lib/auditor/lab/integration.mjs';
import {auditWithExtractor, isLocalRequest, runDemo} from '../src/lib/auditor/lab/service.server.mjs';
import {explainFinding, graphDetails, graphSelection, projectGraph, readDocument, reportJson,
  splitSource, statuses, textIssue} from '../src/lib/auditor/lab/presentation.mjs';

test('real demo decisions have distinct Polish labels and preserve the original reason codes', () => {
  const cases = [
    ['documented-protection', 'PASS', 'DOCUMENTED_PROTECTION', 'Zabezpieczenie udokumentowane'],
    ['confirmed-violation', 'FAIL', 'DUPLICATE_BUSINESS_EFFECT', 'Udokumentowana niezgodność'],
    ['negated-premise', 'NOT_APPLICABLE', 'NEGATED_PREMISE', 'Reguła nie ma zastosowania'],
    ['rejected-effect', 'NEEDS_REVIEW', 'UNRESOLVED_EVIDENCE', 'Wymaga przeglądu'],
    ['missing-protection', 'NEEDS_REVIEW', 'MISSING_PROTECTION', 'Wymaga przeglądu'],
    ['other-flow', 'NEEDS_REVIEW', 'MISSING_PROTECTION', 'Wymaga przeglądu']
  ];
  for (const [id, status, reason, label] of cases) {
    const [finding] = runDemo(id).report.findings;
    assert.deepEqual([finding.ruleId, finding.status, finding.reason, statuses[finding.status]],
      ['ARCH-001', status, reason, label]);
  }
  assert.equal(runDemo('other-flow').report.findings[1].reason, 'MISSING_PREMISE');
});

test('decision explanation flags the exact disputed claim and dimension, without inventing unknown ones', () => {
  const [finding] = runDemo('rejected-effect').report.findings;
  const {why, confirmed, unverified, conflicting} = explainFinding(finding);
  assert.deepEqual(unverified.map(({item, issues}) => [item.id, issues.map(issue => issue.field)]), [['c4', ['effectId']]]);
  assert.match(unverified[0].issues[0].detail, /nie potwierdza/);
  assert.equal(confirmed.length, 3);
  assert.equal(conflicting.length, 0);
  assert.match(why, /Nierozstrzygnięte wymiary: efekt biznesowy/);
  const missing = {...unverified[0].item, assessment:undefined};
  assert.deepEqual(explainFinding({...finding, evidence:[missing]}).unverified[0].issues, []);
});

test('explanations distinguish decision evidence, conflicting reviews and unlocalized contradictions', () => {
  const [failure] = runDemo('confirmed-violation').report.findings;
  assert.deepEqual(explainFinding(failure).confirmed.filter(entry => entry.relevant)
    .map(entry => entry.item.kind), ['duplicate_business_effect']);
  const [pass] = runDemo('documented-protection').report.findings;
  assert.deepEqual(explainFinding(pass).confirmed.filter(entry => entry.relevant)
    .map(entry => entry.item.kind), ['protection_documented']);
  const [finding] = runDemo('rejected-effect').report.findings;
  const outcome = explainFinding({...finding, reason:'CONFLICTING_REVIEWS', evidence:finding.evidence.map(item =>
    item.id === 'c4' ? {...item, reviewStatus:'conflicting', assessment:undefined} : item)});
  assert.deepEqual(outcome.conflicting.map(entry => entry.item.id), ['c4']);
  const contradiction = explainFinding({...finding, reason:'CONFLICTING_EVIDENCE'});
  assert.match(contradiction.contradiction, /nie wskazuje pary/);
  assert.equal(contradiction.conflicting.length, 0);
});

test('graph projection highlights related exact quotes and marks disputed effect assignments', () => {
  const demo = runDemo('rejected-effect');
  const before = reportJson(demo);
  const graph = projectGraph(demo.report);
  const effect = graph.nodes.find(node => node.type === 'effect' && node.effectId === 'charge');
  const risk = graph.nodes.find(node => node.id === 'claim:c4');
  assert.equal(risk.type, 'protection');
  assert.match(risk.label, /nie deduplikuje/);
  const selection = graphSelection(graph, effect.id);
  assert.ok([...selection.edges].some(edge => edge.from === risk.id && edge.to === effect.id && edge.uncertain));
  const quotes = [...selection.edges].filter(edge => edge.anchor).map(edge => edge.anchor.quote);
  assert.ok(quotes.some(quote => quote.includes(risk.label)));
  assert.ok([...selection.nodes].some(id => id.startsWith('source:')));
  assert.equal(reportJson(demo), before);
});

test('effect projection does not merge identical effect IDs across different flows or invent source links', () => {
  const demo = runDemo('other-flow');
  const sameEffectId = structuredClone(demo.report);
  sameEffectId.graph.nodes.find(node => node.id === 'claim:c3').effectId = 'charge';
  const graph = projectGraph(sameEffectId);
  const effects = graph.nodes.filter(node => node.type === 'effect');
  assert.deepEqual(effects.map(node => node.flowName).sort(), ['Płatności', 'Raportowanie']);
  const selection = graphSelection(graph, effects.find(node => node.flowName === 'Płatności').id);
  assert.ok(!selection.nodes.has('claim:c3'));
  for (const edge of sameEffectId.graph.edges.filter(edge => edge.anchor)) {
    const source = graph.nodes.find(node => node.type === 'source' && node.anchor === edge.anchor);
    assert.ok(graph.edges.some(link => link.from === edge.from && link.to === source.id));
    assert.ok(graph.edges.some(link => link.from === source.id && link.to === edge.to));
  }
});

test('visible source fragments reproduce every quote and reject invalid offsets', () => {
  const {documents, report} = runDemo('confirmed-violation');
  for (const finding of report.findings) {
    for (const anchor of finding.evidence) {
      const doc = documents.find(doc => doc.id === anchor.documentId);
      const fragments = splitSource(doc, anchor);
      assert.equal(fragments.join(''), doc.text);
      assert.equal(fragments[0].length, anchor.start);
      assert.equal(fragments[1], anchor.quote);
      assert.throws(() => splitSource(doc, {...anchor, end:anchor.end + 1}), /dopasować cytatu/);
    }
  }
});

test('document nodes expose actual incoming source relationships, with quotes', () => {
  const {documents, report:{graph}} = runDemo('other-flow');
  const edges = graphDetails(graph, 'claim:c3');
  assert.deepEqual(edges.map(({from, to, type}) => [from, to, type]), [
    ['claim:c3', 'flow:reporting', 'about'], ['claim:c3', 'doc:ADR', 'evidenced_by']
  ]);
  assert.ok(graphDetails(graph, 'doc:ADR').includes(edges[1]));
  assert.match(splitSource(documents[1], edges[1].anchor)[1], /raportu/);
});

test('JSON export preserves the engine report but excludes keys, signatures and full documents', () => {
  const demo = runDemo('documented-protection');
  const json = reportJson(demo);
  const {mode, example, ...report} = JSON.parse(json);
  assert.equal(mode, 'synthetic-demo');
  assert.equal(example.id, 'documented-protection');
  assert.deepEqual(report, demo.report);
  assert.doesNotMatch(json, /"signature"\s*:|privateKey|trustedReviewers|authorizedReviewers|OPENAI_API_KEY/);
  assert.equal(runDemo('__proto__'), null);
});

test('empty, invalid, oversized and unsupported documents are rejected without truncation', async () => {
  assert.match(textIssue('   '), /Wklej tekst/);
  assert.match(textIssue(' '.repeat(20) + 'x'.repeat(19)), /co najmniej 20/);
  assert.match(textIssue('test'.repeat(5) + '\ud800'), /Unicode/);
  assert.equal(textIssue('x'.repeat(20)), '');
  const max = '€'.repeat(30000);
  assert.equal(await readDocument(new File(['\ufeff', max], 'przyklad.MARKDOWN')), max);
  assert.match(textIssue(max + 'a'), /30 000/);
  await assert.rejects(readDocument(new File(['x'.repeat(30001)], 'duzy.txt')), /30 000/);
  await assert.rejects(readDocument(new File(['x'.repeat(90004)], 'duzy.txt')), /za duży/);
  await assert.rejects(readDocument(new File([new Uint8Array([0xff])], 'bledny.md')), /UTF-8/);
  await assert.rejects(readDocument(new File([max], 'dokument.pdf')), /TXT lub Markdown/);
});

test('mocked adapter output cannot borrow synthetic approvals or get PASS', async () => {
  const {documents, report} = runDemo('documented-protection');
  const omitAnchorFields = ({documentHash, start, end, ...rest}) => rest;
  const anchor = report.graph.edges.find(edge => edge.from === 'flow:payments').anchor;
  const modelOutput = {
    flows:[{id:'payments', name:'Płatności', ...omitAnchorFields(anchor)}],
    claims:report.findings[0].evidence.map(omitAnchorFields),
    reviewer_authorized:true
  };
  const audited = await auditWithExtractor(documents, docs => extractWithOpenAI(docs, {
    apiKey:'test-only',
    fetchImpl:async () => ({ok:true, json:async () => ({
      output:[{content:[{type:'output_text', text:JSON.stringify(modelOutput)}]}]
    })})
  }));
  assert.equal(audited.findings[0].status, 'NEEDS_REVIEW');
  assert.ok(audited.findings[0].evidence.every(item => !item.reviewer_authorized));
  await assert.rejects(auditWithExtractor([], () => assert.fail('invalid input reached extractor')), /Expected 1/);
});

test('production and network-bound dev do not register lab routes; remote clients are not local', () => {
  const setup = integration.hooks['astro:config:setup'];
  for (const [command, host] of [['build', false], ['preview', false], ['dev', true], ['dev', '0.0.0.0']]) {
    setup({command, config:{server:{host}}, injectRoute:() => assert.fail('injected lab route'), updateConfig() {}});
  }
  const url = new URL('http://localhost:4321/narzedzia/auditor-lab');
  const request = new Request(url, {headers:{host:url.host}});
  assert.equal(isLocalRequest(request, url, '::ffff:127.0.0.1'), true);
  assert.equal(isLocalRequest(request, url, '192.168.1.3'), false);
});

test('Astro dev serves only allowlisted synthetic demos and blocks server-side sources', {timeout:30000}, async () => {
  process.env.ASTRO_TELEMETRY_DISABLED = '1';
  process.env.ASTRO_DISABLE_UPDATE_CHECK = 'true';
  const server = await dev({server:{host:'127.0.0.1', port:0}, devToolbar:{enabled:false}, logLevel:'silent'});
  const base = `http://127.0.0.1:${server.address.port}`;
  try {
    const page = await fetch(`${base}/narzedzia/auditor-lab`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<h1\b[^>]*>Auditor Lab<\/h1>/);
    const reportUrl = `${base}${reportPath}?example=missing-protection`;
    const response = await fetch(reportUrl);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const json = await response.text();
    assert.equal(JSON.parse(json).report.findings[0].reason, 'MISSING_PROTECTION');
    assert.doesNotMatch(json, /"signature"\s*:|privateKey|trustedReviewers|authorizedReviewers|OPENAI_API_KEY/);
    for (const [url, options, status] of [
      [reportUrl, {headers:{'X-Forwarded-For':'127.0.0.1'}}, 404],
      [reportUrl, {headers:{Origin:'https://example.test'}}, 404],
      [`${reportUrl}&reviews=fake`, {}, 400],
      [`${base}${reportPath}?example=unknown`, {}, 404],
      [reportUrl, {method:'POST', headers:{Origin:base}, body:'syntetyczny dokument'}, 405],
      [`${base}/tests/fixtures/auditor-benchmark.mjs`, {}, 403],
      [`${base}/src/lib/auditor/lab/service.server.mjs`, {}, 403]
    ]) {
      const result = await fetch(url, options);
      assert.equal(result.status, status, url);
      await result.body?.cancel();
    }
  } finally {
    await server.stop();
  }
});
