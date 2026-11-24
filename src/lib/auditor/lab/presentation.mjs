export const MAX_TEXT = 30000;
export const MAX_FILE_BYTES = MAX_TEXT * 3 + 3; // UTF-8 bytes for UTF-16 code units, plus optional BOM.

export const statuses = {
  PASS:'Zabezpieczenie udokumentowane',
  NEEDS_REVIEW:'Wymaga przeglądu',
  FAIL:'Udokumentowana niezgodność',
  NOT_APPLICABLE:'Reguła nie ma zastosowania'
};

const kinds = {
  possible_duplicate_delivery:'Możliwy duplikat dostarczenia',
  exactly_once_requirement:'Wymóg jednokrotnego efektu',
  protection_documented:'Zabezpieczenie',
  duplicate_business_effect:'Powtórzony efekt biznesowy'
};
export const kindLabel = kind => kinds[kind] ?? kind;
export const edgeLabel = type => ({
  about:'Dotyczy przepływu', effect_scope:'Przypisany efekt',
  evidenced_by:'Ma cytat źródłowy', source_document:'Cytat pochodzi z dokumentu'
})[type];

const effects = new Map([['charge', 'Obciążenie rachunku'], ['report', 'Utworzenie raportu']]);
export const effectLabel = id => effects.get(id) ?? id ?? 'Nieustalony';
export const claimState = status => ({
  existing:'opisuje stan istniejący', planned:'opisuje plan', negated:'zawiera zaprzeczenie', unclear:'jest niejednoznaczne'
})[status] ?? status;

const dimensions = [
  ['kind', 'kind', 'rodzaj twierdzenia'],
  ['status', 'status', 'stan twierdzenia'],
  ['flow', 'flowId', 'przepływ biznesowy'],
  ['effect', 'effectId', 'efekt biznesowy'],
  ['incidentState', 'incidentState', 'stan incydentu']
];

export function reviewGaps(item) {
  const issues = [];
  for (const [assessmentKey, field, label] of dimensions) {
    if (assessmentKey === 'incidentState' && item.incidentState == null) continue;
    const verdict = item.assessment?.[assessmentKey];
    if (verdict === 'unsupported') issues.push({field, label, detail:'recenzja nie potwierdza przypisania'});
    else if (verdict === 'partial') issues.push({field, label, detail:'potwierdzenie częściowe'});
    if (field === 'effectId' && item.effectId == null) issues.push({field, label, detail:'nie wskazano efektu'});
    if ((field === 'status' || field === 'incidentState') && item[field] === 'unclear') {
      issues.push({field, label, detail:'w źródle nie ustalono jednoznacznego stanu'});
    }
  }
  return issues;
}

const guidance = {
  DOCUMENTED_PROTECTION: ['Dokumentacja opisuje ochronę tego samego efektu, którego powtórzenie jest możliwe i niedozwolone.',
    'Zweryfikuj w testach wdrożenia, czy ponowne dostarczenie nie wywołuje drugiego efektu.'],
  DUPLICATE_BUSINESS_EFFECT: ['Dokumentacja potwierdza aktualny, nierozwiązany przypadek powtórzenia efektu wymagającego jednokrotności.',
    'Sprawdź zakres incydentu, usuń przyczynę i udokumentuj test ponownego dostarczenia po naprawie.'],
  NEGATED_PREMISE: ['Dokumentacja wyklucza co najmniej jedną przesłankę: możliwość duplikatu dostarczenia lub wymóg jednokrotnego efektu.',
    'Potwierdź, że wyłączenie dotyczy ocenianego wariantu, i ponów ocenę, gdy założenia się zmienią.'],
  MISSING_PROTECTION: ['Raport nie zawiera potwierdzonego zabezpieczenia dla ocenianego efektu. To nie dowodzi, że go nie ma.',
    'Znajdź w HLD lub ADR opis ochrony dla tego efektu albo uzupełnij dokumentację.'],
  MISSING_PREMISE: ['Brakuje potwierdzonych danych o możliwym duplikacie dostarczenia lub wymogu jednokrotności tego efektu.',
    'Doprecyzuj warunki ponownego dostarczenia i wymaganie biznesowe dla tego efektu.'],
  UNRESOLVED_EVIDENCE: ['Co najmniej jeden dowód wymaga wyjaśnienia. Raport nie rozstrzyga zgodności.',
    'Porównaj wskazane twierdzenia z cytatami, wyjaśnij brakujące wymiary i ponów przegląd.'],
  CONFLICTING_EVIDENCE: ['Silnik wykrył sprzeczność w dowodach dla tej oceny.',
    'Porównaj źródła i ustal, który opis obowiązuje dla danego przepływu i efektu.'],
  CONFLICTING_REVIEWS: ['Silnik wykrył sprzeczne recenzje tego samego twierdzenia.',
    'Ponownie przejrzyj oznaczone twierdzenie i wyjaśnij rozbieżność ocen.'],
  PLANNED_PROTECTION: ['Zabezpieczenie opisano jako plan, a nie stan obecny.',
    'Po wdrożeniu uaktualnij dokumentację i potwierdź ochronę testem.'],
  NEGATED_PROTECTION: ['Dokumentacja neguje zabezpieczenie, ale nie potwierdza powtórzenia efektu.',
    'Ustal, jak obsłużyć ponowienie, i udokumentuj stan ochrony tego efektu.'],
  HISTORICAL_INCIDENT: ['Raport wskazuje dawny incydent bez potwierdzonej naprawy.',
    'Zweryfikuj, czy incydent zamknięto, i wskaż aktualne zabezpieczenie w dokumentacji.'],
  NO_CURRENT_PROTECTION_EVIDENCE: ['Opis dawnego incydentu lub jego naprawy nie potwierdza aktualnego zabezpieczenia.',
    'Znajdź niezależny dowód działania aktualnego mechanizmu dla tego efektu.'],
  UNRESOLVED_REQUIREMENT: ['Potwierdzono powtórzenie efektu, ale dokumentacja neguje wymaganie jego jednokrotności.',
    'Uzgodnij z właścicielem procesu obowiązujące wymaganie i zaktualizuj dokumentację.'],
  NO_FLOWS: ['Nie rozpoznano przepływu biznesowego do oceny.',
    'Wskaż przepływ i efekt biznesowy, który ma zostać oceniony.']
};

function isDecisionEvidence(reason, item) {
  switch (reason) {
    case 'DOCUMENTED_PROTECTION': return item.kind === 'protection_documented' && item.status === 'existing';
    case 'DUPLICATE_BUSINESS_EFFECT': return item.kind === 'duplicate_business_effect'
      && item.status === 'existing' && item.incidentState === 'current_unresolved';
    case 'NEGATED_PREMISE': return ['possible_duplicate_delivery', 'exactly_once_requirement'].includes(item.kind)
      && item.status === 'negated';
    default: return false;
  }
}

export function explainFinding(finding) {
  const [explanation, action] = guidance[finding.reason] ?? [finding.message, 'Przejrzyj dowody i szczegóły decyzji silnika.'];
  const confirmed = [], unverified = [], conflicting = [];
  for (const item of finding.evidence) {
    const issues = reviewGaps(item);
    const sameScope = item.flowId === finding.flowId && item.effectId === finding.effectId;
    const entry = {item, issues, sameScope};
    if (item.reviewStatus === 'conflicting') conflicting.push(entry);
    else if (!item.evidence_sufficient || issues.length || !sameScope) unverified.push(entry);
    else confirmed.push({...entry, relevant: isDecisionEvidence(finding.reason, item)});
  }
  const contradiction = finding.reason === 'CONFLICTING_EVIDENCE'
    ? 'Raport nie wskazuje pary sprzecznych twierdzeń. Porównaj stany i cytaty w sekcjach dowodów; nie przypisujemy sprzeczności pojedynczym twierdzeniom.'
    : finding.reason === 'UNRESOLVED_REQUIREMENT'
      ? 'Ocena wskazuje rozbieżność między zdarzeniem a opisem wymagania. Sprawdź dokładne cytaty w raporcie.'
      : '';
  const gaps = [...new Set(unverified.flatMap(entry => entry.issues.map(issue => issue.label)))];
  const why = finding.reason === 'UNRESOLVED_EVIDENCE' && gaps.length
    ? `Dowód wymaga weryfikacji. Nierozstrzygnięte wymiary: ${gaps.join(', ')}. Raport nie rozstrzyga zgodności.`
    : explanation;
  return {why, action, confirmed, unverified, conflicting, contradiction};
}

export function claimLabel(item) {
  if (item.kind !== 'protection_documented') return kindLabel(item.kind);
  const excerpt = (item.quote ?? '').trim().replace(/^Przepływ [^:\n]+:\s+/i, '').replace(/\s+/g, ' ');
  if (!excerpt) return `${kindLabel(item.kind)} (${claimState(item.status)})`;
  return excerpt.length <= 78 ? excerpt : `${excerpt.slice(0, 76).replace(/\s+\S*$/, '')}…`;
}

export function textIssue(text) {
  if (!text.trim()) return 'Wklej tekst lub wybierz plik.';
  if (!text.isWellFormed()) return 'Dokument zawiera nieprawidłowe znaki Unicode.';
  if (text.length > MAX_TEXT) return 'Dokument przekracza limit 30 000 jednostek tekstu (UTF-16).';
  if (text.trim().length < 20) return 'Wpisz co najmniej 20 jednostek tekstu, nie licząc białych znaków na początku i końcu.';
  return '';
}

export async function readDocument(file) {
  if (!/\.(txt|md|markdown)$/i.test(file.name)) throw new Error('Wybierz plik TXT lub Markdown (.md, .markdown).');
  if (file.size > MAX_FILE_BYTES) throw new Error('Plik jest za duży. Limit dokumentu to 30 000 jednostek tekstu.');
  const bytes = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
  } catch {
    throw new Error('Nie można odczytać pliku. Zapisz go w kodowaniu UTF-8.');
  }
  const issue = textIssue(text);
  if (issue) throw new Error(issue);
  return text;
}

export function splitSource(doc, anchor) {
  if (doc.id !== anchor.documentId || doc.version !== anchor.documentVersion
      || !Number.isInteger(anchor.start) || !Number.isInteger(anchor.end)
      || anchor.start < 0 || anchor.start >= anchor.end || anchor.end > doc.text.length
      || doc.text.slice(anchor.start, anchor.end) !== anchor.quote) {
    throw new Error('Nie można dopasować cytatu do dokumentu źródłowego.');
  }
  return [doc.text.slice(0, anchor.start), anchor.quote, doc.text.slice(anchor.end)];
}

export function graphDetails(graph, id) {
  return graph.edges.filter(edge => edge.from === id || edge.to === id);
}

export const graphTypes = {
  flow:'Przepływ', effect:'Efekt biznesowy', claim:'Twierdzenie',
  protection:'Mechanizm ochronny', source:'Dowód źródłowy', document:'Dokument'
};

export function projectGraph({graph, findings}) {
  const claims = new Map(findings.flatMap(finding => finding.evidence.map(item => [`claim:${item.id}`, item])));
  const nodes = graph.nodes.map(node => {
    const item = claims.get(node.id);
    if (node.type !== 'claim') return {...node};
    return {...node, type:node.label === 'protection_documented' ? 'protection' : 'claim',
      label:item ? claimLabel(item) : kindLabel(node.label)};
  });
  const byId = new Map(nodes.map(node => [node.id, node]));
  const edges = [];
  for (const edge of graph.edges) {
    if (edge.type === 'evidenced_by') {
      const {anchor} = edge;
      const id = `source:${edge.from}:${edge.to}`;
      nodes.push({id, type:'source', label:`${anchor.documentId} · ${anchor.start}–${anchor.end}`, anchor});
      edges.push({...edge, to:id}, {from:id, to:edge.to, type:'source_document'});
      continue;
    }
    if (edge.type === 'about') {
      const assessment = claims.get(edge.from)?.assessment;
      edges.push({...edge, uncertain:assessment?.flow !== 'confirmed'});
      const effectId = byId.get(edge.from)?.effectId;
      if (effectId == null) continue;
      const id = `effect:${edge.to}:${effectId}`;
      if (!byId.has(id)) {
        const node = {id, type:'effect', effectId, flowName:byId.get(edge.to).label, label:effectLabel(effectId)};
        byId.set(id, node);
        nodes.push(node);
      }
      edges.push({from:edge.from, to:id, type:'effect_scope',
        uncertain:assessment?.flow !== 'confirmed' || assessment?.effect !== 'confirmed'});
      continue;
    }
    edges.push({...edge});
  }
  return {nodes, edges};
}

export function graphSelection(graph, id) {
  const edges = new Set(graphDetails(graph, id));
  const direct = new Set([...edges].flatMap(edge => [edge.from, edge.to]));
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const type = nodes.get(id).type;
  for (const edge of graph.edges) {
    if (edge.type === 'evidenced_by' && (direct.has(edge.to)
        || (['flow', 'effect'].includes(type) && direct.has(edge.from)))) edges.add(edge);
  }
  const sources = new Set([...edges].flatMap(edge => [edge.from, edge.to])
    .filter(nodeId => nodes.get(nodeId).type === 'source'));
  for (const edge of graph.edges) {
    if (edge.type === 'source_document' && sources.has(edge.from)) edges.add(edge);
  }
  return {edges, nodes:new Set([id, ...[...edges].flatMap(edge => [edge.from, edge.to])])};
}

export function reportJson(demo) {
  return JSON.stringify({mode:demo.mode, example:demo.example, ...demo.report}, null, 2);
}
