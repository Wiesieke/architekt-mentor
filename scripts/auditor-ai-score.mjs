import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {locateQuote, validateDocuments} from '../src/lib/auditor/core.mjs';
import {extractionGold} from '../tests/fixtures/auditor-ai-gold.mjs';

const rate = (correct, total) => ({correct, total, value:total ? correct / total : null});
const fields = ['kind', 'status', 'incidentState'];
const factFields = [...fields, 'flowId', 'effectId'];
const factKey = claim => JSON.stringify(factFields.map(field => Object.hasOwn(claim ?? {}, field)
  ? claim[field] : ['missing']));
const metrics = (matched, proposed, expected) => ({
  precision:rate(matched, proposed),
  recall:rate(matched, expected),
  f1:proposed + expected ? 2 * matched / (proposed + expected) : null
});

// Maximum one-to-one matching: one long quote cannot satisfy multiple gold records.
function match(predicted, expected, accepts) {
  const matches = new Map();
  function assign(index, visited) {
    for (const [goldIndex, gold] of expected.entries()) {
      if (visited.has(goldIndex) || !accepts(predicted[index], gold)) continue;
      visited.add(goldIndex);
      if (!matches.has(goldIndex) || assign(matches.get(goldIndex), visited)) {
        matches.set(goldIndex, index);
        return true;
      }
    }
    return false;
  }
  predicted.forEach((_, index) => assign(index, new Set()));
  return matches.size;
}

// Exact against the document; only sentence-final punctuation is optional in the gold span.
const requiredSpan = quote => quote.replace(/[.!?]+$/, '');

export function scoreExtraction({documents, gold}, proposed) {
  if (!['flows', 'effects', 'claims'].every(key => Array.isArray(proposed?.[key]))) {
    throw new Error('Expected extraction arrays for flows, effects and claims.');
  }
  const docs = validateDocuments(documents);
  const validQuote = item => {
    const doc = docs.get(item?.documentId);
    if (!doc || doc.version !== item.documentVersion || doc.documentHash !== item.documentHash) return false;
    try {
      const {start, end} = locateQuote(doc, item.quote);
      return item.start === start && item.end === end;
    } catch { return false; }
  };
  const candidates = [...proposed.flows, ...proposed.effects, ...proposed.claims];
  const withQuote = candidates.filter(validQuote);
  const anchored = new Set(withQuote);
  const goldSources = new Map([...gold.flows, ...gold.effects, ...gold.claims].map(item =>
    [item, item.evidence ?? [item]]));
  const goldAnchors = new Map([...goldSources.values()].flat().map(item => {
    const doc = docs.get(item.documentId);
    if (doc?.version !== item.documentVersion) throw new Error('Invalid gold document version.');
    const {start} = locateQuote(doc, item.quote);
    return [item, {start, end:start + requiredSpan(item.quote).length}];
  }));
  const sameSource = (item, expected) => item?.documentId === expected.documentId
    && item.documentVersion === expected.documentVersion;
  const supports = (item, expected) => anchored.has(item) && goldSources.get(expected).some(source => {
    const {start, end} = goldAnchors.get(source);
    return sameSource(item, source) && item.start <= start && item.end >= end;
  });
  const goldFacts = new Map(gold.claims.map(item => [factKey(item), item]));
  if (goldFacts.size !== gold.claims.length) throw new Error('Duplicate gold fact; list its alternative evidence together.');
  const proposedFacts = new Map();
  const duplicates = [];
  const evidence = proposed.claims.map(item => {
    const key = factKey(item);
    const expected = goldFacts.get(key);
    if (proposedFacts.has(key)) duplicates.push(item);
    else proposedFacts.set(key, item);
    return {
      claimId:item?.id ?? null,
      exactQuote:anchored.has(item),
      sourceAccepted:Boolean(expected && goldSources.get(expected).some(source => sameSource(item, source))),
      supportsFact:Boolean(expected && supports(item, expected))
    };
  });
  const falsePositives = [...proposedFacts].filter(([key]) => !goldFacts.has(key)).map(([, item]) => item);
  const falseNegatives = [...goldFacts].filter(([key]) => !proposedFacts.has(key)).map(([, item]) => item);
  const grounded = new Set(proposed.claims.filter((_, index) => evidence[index].supportsFact).map(factKey));
  const content = (a, b) => supports(a, b) && fields.every(field => a[field] === b[field]);
  const comparable = match(proposed.claims, gold.claims, content);
  return {
    ...metrics(proposedFacts.size - falsePositives.length, proposedFacts.size, goldFacts.size),
    groundedFacts:metrics(grounded.size, proposedFacts.size, goldFacts.size),
    flowIdAccuracy:rate(match(proposed.flows, gold.flows, (a, b) => a?.id === b.id && supports(a, b)), gold.flows.length),
    effectIdAccuracy:rate(match(proposed.effects, gold.effects, (a, b) =>
      a?.id === b.id && a.flowId === b.flowId && supports(a, b)), gold.effects.length),
    claimEffectAssignmentAccuracy:rate(grounded.size, comparable),
    quoteSourceAgreement:rate(withQuote.length, candidates.length),
    evidence:{
      acceptedSource:rate(evidence.filter(item => item.sourceAccepted).length, evidence.length),
      supportsFact:rate(evidence.filter(item => item.supportsFact).length, evidence.length),
      claims:evidence
    },
    falsePositives, falseNegatives, duplicates
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [caseId, reportPath] = process.argv.slice(2);
    const scenario = extractionGold.find(item => item.id === caseId);
    if (!scenario || !reportPath) {
      throw new Error(`Użycie: node scripts/auditor-ai-score.mjs <${extractionGold.map(item => item.id).join('|')}> <raport.json>`);
    }
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    if (report.mode !== 'ai-experimental' || report.preliminary !== true) throw new Error('Oczekiwano raportu AI v0.4.');
    const sourceHashes = validateDocuments(scenario.documents);
    if (!Array.isArray(report.graph?.nodes) || ![...sourceHashes.values()].every(doc =>
      report.graph.nodes.some(node => node?.id === `doc:${doc.id}` && node.version === doc.version
        && node.documentHash === doc.documentHash))) throw new Error('Raport dotyczy innych wersji lub innej treści dokumentów.');
    console.log(JSON.stringify({caseId, usage:report.usage, ...scoreExtraction(scenario, report.extraction)}, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
