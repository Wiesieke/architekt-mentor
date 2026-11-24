import {claimState, edgeLabel, effectLabel, explainFinding, graphSelection, graphTypes, kindLabel,
  projectGraph, readDocument, reportJson, splitSource, statuses, textIssue} from './presentation.mjs';

const root = document.querySelector('[data-auditor-lab]');
const get = id => root.querySelector(`#lab-${id}`);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
const svg = (tag, attrs = {}) => {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};
const bytes = text => new TextEncoder().encode(text).length.toLocaleString('pl-PL');

const run = get('run');
const results = get('results');
const progress = get('progress');
const example = get('example');
const exportLink = get('export');
const sourceViews = new Map();
const viewButtons = [...root.querySelectorAll('[data-view]')];
let exportUrl;
let pending;
let own = false;

const slots = [...root.querySelectorAll('[data-document]')].map(slot => {
  const file = slot.querySelector('input');
  const text = slot.querySelector('textarea');
  const remove = slot.querySelector('[data-remove]');
  const error = slot.querySelector('[data-error]');
  const meta = slot.querySelector('[data-meta]');
  let name = '';
  let revision = 0;
  let loading = false;
  let fileIssue = '';

  function show(issue = '') {
    error.textContent = issue;
    text.setAttribute('aria-invalid', String(Boolean(issue && !fileIssue)));
    file.setAttribute('aria-invalid', String(Boolean(fileIssue)));
    meta.textContent = loading ? 'Odczytywanie pliku…' : text.value
      ? `${name || `${slot.dataset.document} · tekst`} · ${bytes(text.value)} B · ${text.value.length.toLocaleString('pl-PL')} jednostek UTF-16`
      : 'Brak dokumentu.';
    remove.disabled = !text.value && !fileIssue && !loading;
  }
  text.addEventListener('input', () => {
    ++revision;
    loading = false;
    fileIssue = '';
    file.value = '';
    show(text.value ? textIssue(text.value) : '');
    progress.textContent = '';
  });
  file.addEventListener('change', async () => {
    const selected = file.files[0];
    if (!selected) return;
    const id = ++revision;
    loading = true;
    fileIssue = '';
    show();
    progress.textContent = '';
    try {
      const content = await readDocument(selected);
      if (id !== revision) return;
      text.value = content;
      name = selected.name;
    } catch (issue) {
      if (id !== revision) return;
      fileIssue = issue instanceof Error ? issue.message : 'Nie udało się odczytać pliku.';
      file.value = '';
    } finally {
      if (id === revision) {
        loading = false;
        show(fileIssue);
      }
    }
  });
  remove.addEventListener('click', () => {
    ++revision;
    name = '';
    fileIssue = '';
    loading = false;
    text.value = '';
    file.value = '';
    show();
    progress.textContent = '';
    text.focus();
  });
  return {
    validate() {
      const issue = loading ? 'Poczekaj na odczyt pliku.' : fileIssue || textIssue(text.value);
      show(issue);
      return !issue;
    }
  };
});

function setView(name) {
  for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === name));
  get('report').hidden = name !== 'report';
  get('graph').hidden = name !== 'graph';
}
for (const button of viewButtons) button.addEventListener('click', () => setView(button.dataset.view));

function clearResult() {
  pending?.abort();
  pending = null;
  if (exportUrl) {
    URL.revokeObjectURL(exportUrl);
    exportUrl = null;
    exportLink.removeAttribute('href');
  }
  results.hidden = true;
  get('report').replaceChildren();
  get('chart').replaceChildren();
  get('node').textContent = 'Wybierz węzeł grafu.';
  get('sources').replaceChildren();
  sourceViews.clear();
  run.disabled = false;
  progress.textContent = '';
}

for (const radio of root.querySelectorAll('input[name=lab-mode]')) {
  radio.addEventListener('change', () => {
    own = radio.value === 'own';
    clearResult();
    get('own-input').hidden = !own;
    get('demo-input').hidden = own;
    run.textContent = own ? 'Sprawdź dokumenty' : 'Uruchom demo offline';
    get('mode-info').textContent = own
      ? 'Możesz sprawdzić format i rozmiar. Własne dokumenty pozostają w tej karcie; tryb offline ich nie analizuje i nie tworzy raportu.'
      : 'Demo offline korzysta z ręcznie przygotowanych faktów i podpisanych recenzji testowych. Nie wywołuje modelu AI.';
  });
}
example.addEventListener('change', clearResult);

function showSource(anchor) {
  const {doc, details, pre} = sourceViews.get(anchor.documentId);
  const [before, quote, after] = splitSource(doc, anchor);
  const highlight = element('mark', quote);
  highlight.tabIndex = -1;
  pre.replaceChildren(before, highlight, after);
  details.open = true;
  highlight.focus({preventScroll:true});
  highlight.scrollIntoView({block:'center'});
}

function quoteCard(anchor, title) {
  const card = element('div', undefined, 'lab-evidence');
  const caption = element('p');
  caption.append(element('strong', title), ` · ${anchor.documentId} v${anchor.documentVersion}`);
  const jump = element('button', `Pokaż cytat w ${anchor.documentId}`, 'lab-link');
  jump.type = 'button';
  jump.addEventListener('click', () => showSource(anchor));
  card.append(caption, element('blockquote', anchor.quote), jump);
  return card;
}

function renderSources(docs) {
  for (const doc of docs) {
    const details = element('details', undefined, 'lab-document');
    const pre = element('pre', doc.text, 'lab-source-text');
    details.append(element('summary', `${doc.id} v${doc.version} · ${bytes(doc.text)} B`), pre);
    sourceViews.set(doc.id, {doc, details, pre});
    get('sources').append(details);
  }
}

function renderFindings(findings) {
  for (const finding of findings) {
    const {why, action, confirmed, unverified, conflicting, contradiction} = explainFinding(finding);
    const card = element('article', undefined, 'lab-finding');
    const headline = element('div', undefined, 'lab-assessment');
    const title = element('h3', `Ocena ${finding.ruleId}`);
    title.append(element('span', statuses[finding.status] ?? finding.status, `lab-status ${finding.status}`));
    const scope = element('p');
    scope.append(element('strong', 'Przepływ biznesowy: '), finding.flowName ?? 'Nieustalony',
      element('br'), element('strong', 'Efekt biznesowy: '), effectLabel(finding.effectId));
    const actionLine = element('p', undefined, 'lab-action');
    actionLine.append(element('strong', 'Co zrobić: '), action);
    const summary = element('p', undefined, 'lab-tally');
    summary.append(element('strong', 'Podsumowanie dowodów: '),
      `${confirmed.length} potwierdzonych · ${unverified.length} do weryfikacji · ${conflicting.length} ze sprzecznymi recenzjami.`);
    headline.append(title, scope,
      element('p', 'Sprawdzono, czy ponowne dostarczenie może powtórzyć efekt, który powinien zajść tylko raz, i czy udokumentowano jego ochronę.', 'lab-hint'),
      element('p', why), actionLine, summary);

    function evidenceSection(heading, entries, empty, note) {
      const section = element('section', undefined, 'lab-evidence-section');
      section.append(element('h4', heading));
      if (note) section.append(element('p', note, 'lab-hint'));
      if (!entries.length && empty) section.append(element('p', empty, 'lab-hint'));
      for (const {item, relevant, issues, sameScope} of entries) {
        const evidence = quoteCard(item, kindLabel(item.kind));
        if (relevant) evidence.prepend(element('span', 'Dowód bezpośrednio związany z decyzją', 'lab-evidence-key'));
        const state = element('p', `Twierdzenie ${claimState(item.status)}.`, 'lab-hint');
        if (!sameScope) state.append(` Przypisano do: ${item.flowId} / ${effectLabel(item.effectId)}. To przypisanie nie odpowiada zakresowi oceny.`);
        evidence.append(state);
        if (issues.length) {
          const list = element('ul', undefined, 'lab-gap-list');
          for (const {label, field, detail} of issues) {
            const issue = element('li');
            issue.append(element('strong', label), ` (${field}) — ${detail}.`);
            list.append(issue);
          }
          evidence.append(list);
        } else if (item.reviewStatus === 'conflicting') {
          evidence.append(element('p', 'Raport nie pokazuje, w których wymiarach różniły się recenzje.', 'lab-hint'));
        } else if (!item.evidence_sufficient) {
          evidence.append(element('p', 'Raport nie wskazuje nierozstrzygniętego wymiaru. Sprawdź stan recenzji w szczegółach.', 'lab-hint'));
        }
        section.append(evidence);
      }
      return section;
    }

    const technical = element('details', undefined, 'lab-technical');
    technical.append(element('summary', 'Szczegóły techniczne i podpisy recenzji'),
      element('p', `${finding.status} · ${finding.reason} · ${finding.flowId ?? '—'} / ${finding.effectId ?? '—'}`),
      element('p', finding.message),
      element('p', 'Silnik podaje wynik weryfikacji podpisu i testowego upoważnienia, nie sam podpis. Nie jest to autoryzacja człowieka.', 'lab-hint'));
    const reviews = element('ul');
    for (const item of finding.evidence) {
      reviews.append(element('li', `${item.id} · ${item.documentId} v${item.documentVersion} [${item.start}, ${item.end}) · recenzja: ${item.reviewStatus} · podpis: ${item.signature_valid ? 'zweryfikowany' : 'niezweryfikowany'} · upoważnienie testowe: ${item.reviewer_authorized ? 'tak' : 'nie'}${item.reviewerId ? ` (${item.reviewerId})` : ''}`));
    }
    if (reviews.childElementCount) technical.append(reviews);
    card.append(headline,
      evidenceSection('Dowody wymagające weryfikacji', unverified, 'Brak takich dowodów w raporcie.'),
      evidenceSection('Sprzeczności', conflicting, contradiction ? '' : 'Silnik nie zgłosił sprzeczności w tej ocenie.', contradiction),
      evidenceSection('Dowody potwierdzone', confirmed, 'Brak potwierdzonych dowodów dla tego zakresu.'),
      technical);
    get('report').append(card);
  }
}

function renderGraph(report) {
  const graph = projectGraph(report);
  const columns = [
    ['Zakres', ['flow', 'effect']],
    ['Twierdzenia i ochrona', ['claim', 'protection']],
    ['Dowody źródłowe', ['source']],
    ['Dokumenty', ['document']]
  ].map(([title, types]) => [title, types.flatMap(type => graph.nodes.filter(node => node.type === type))]);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const positions = new Map();
  const links = new Map();
  const paths = new Map();
  const height = 45 + 77 * Math.max(1, ...columns.map(([, column]) => column.length));
  const diagram = svg('svg', {viewBox:`0 0 1100 ${height}`, role:'group', 'aria-label':'Graf dowodów ARCH-001'});
  const definitions = svg('defs');
  const marker = svg('marker', {id:'lab-direction', viewBox:'0 0 10 10', refX:8, refY:5, markerWidth:6, markerHeight:6, orient:'auto'});
  marker.append(svg('path', {d:'M 0 0 L 10 5 L 0 10 z', fill:'#516f77'}));
  definitions.append(marker);
  diagram.append(definitions);
  const relations = svg('g', {'aria-hidden':'true'});
  diagram.append(relations);
  const nodeLabel = node => `${graphTypes[node.type]}: ${node.label}${node.flowName ? ` (${node.flowName})` : ''}`;
  function showNode(node) {
    const selection = graphSelection(graph, node.id);
    for (const [id, link] of links) {
      link.classList.toggle('is-related', selection.nodes.has(id));
      link.classList.toggle('is-selected', id === node.id);
      if (id === node.id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    for (const [edge, path] of paths) path.classList.toggle('is-related', selection.edges.has(edge));
    const panel = get('node');
    panel.replaceChildren(element('h3', nodeLabel(node)));
    if (node.version) panel.append(element('p', `Wersja ${node.version}`));
    if (node.status) panel.append(element('p', `Twierdzenie ${claimState(node.status)}. Efekt: ${effectLabel(node.effectId)}.`));
    const list = element('ul');
    for (const edge of selection.edges) {
      if (edge.type === 'source_document') continue;
      const from = nodes.get(edge.from);
      const to = nodes.get(edge.to);
      const item = element('li', `${from.label} — ${edgeLabel(edge.type).toLowerCase()} — ${to.label}${edge.uncertain ? ' (niepotwierdzone przypisanie)' : ''}`);
      if (edge.anchor) item.append(quoteCard(edge.anchor, graphTypes[from.type]));
      list.append(item);
    }
    if (list.childElementCount) panel.append(list);
    else panel.append(element('p', 'Brak zapisanych powiązań dla tego węzła.'));
    panel.focus();
  }
  columns.forEach(([columnTitle, column], col) => {
    const x = 20 + col * 275;
    const heading = svg('text', {x, y:28});
    heading.textContent = columnTitle;
    diagram.append(heading);
    column.forEach((node, row) => {
      const y = 42 + row * 77;
      positions.set(node.id, {x, y});
      const link = svg('a', {href:'#lab-node', 'aria-label':nodeLabel(node), 'data-type':node.type});
      links.set(node.id, link);
      const label = svg('text', {x:x+10, y:y+18});
      label.textContent = graphTypes[node.type];
      label.classList.add('lab-graph-type');
      const name = svg('text', {x:x+10, y:y+36});
      const words = node.label.match(/\S+(?:\s+|$)/g) ?? [];
      const lines = [''];
      for (const word of words) {
        if ((lines.at(-1) + word).trim().length > 31 && lines.at(-1)) lines.push('');
        lines[lines.length - 1] += word;
      }
      for (const [index, line] of lines.slice(0, 2).entries()) {
        const span = svg('tspan', {x:x+10, dy:index ? 15 : 0});
        const text = line.trim();
        span.textContent = `${text.slice(0, 31)}${text.length > 31 || (index === 1 && lines.length > 2) ? '…' : ''}`;
        name.append(span);
      }
      const tooltip = svg('title');
      tooltip.textContent = nodeLabel(node);
      link.append(tooltip, svg('rect', {x, y, width:235, height:60, rx:8}), label, name);
      link.addEventListener('click', event => {
        event.preventDefault();
        showNode(node);
      });
      diagram.append(link);
    });
  });
  for (const edge of graph.edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    const left = to.x < from.x;
    const path = svg('line', {x1:from.x + (left ? 0 : 235), y1:from.y + 30,
      x2:to.x + (left ? 236 : -1), y2:to.y + 30,
      class:`${edge.type}${edge.uncertain ? ' is-uncertain' : ''}`, 'marker-end':'url(#lab-direction)'});
    paths.set(edge, path);
    relations.append(path);
  }
  get('chart').append(diagram);
}

run.disabled = false;
run.addEventListener('click', async () => {
  clearResult();
  if (own) {
    const valid = slots.map(slot => slot.validate()).every(Boolean);
    progress.textContent = valid
      ? 'Format i rozmiar są prawidłowe. Nie wykonano audytu: analiza AI jest niedostępna.'
      : 'Sprawdź komunikaty przy dokumentach. Nie wykonano audytu.';
    return;
  }
  const task = new AbortController();
  pending = task;
  run.disabled = true;
  progress.textContent = 'Uruchamianie demonstratora…';
  try {
    const url = new URL(root.dataset.reportPath, location.origin);
    url.searchParams.set('example', example.value);
    const signal = AbortSignal.any([task.signal, AbortSignal.timeout(10000)]);
    const response = await fetch(url, {signal, cache:'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const demo = await response.json();
    if (pending !== task) return;
    if (demo.mode !== 'synthetic-demo' || demo.example?.id !== example.value) {
      throw new Error('Dane demonstratora nie odpowiadają wybranemu przykładowi.');
    }
    renderSources(demo.documents);
    renderFindings(demo.report.findings);
    renderGraph(demo.report);
    get('summary').textContent = `Scenariusz syntetyczny · Evidence Model v${demo.report.version}`;
    setView('report');
    exportUrl = URL.createObjectURL(new Blob([reportJson(demo)], {type:'application/json'}));
    exportLink.href = exportUrl;
    exportLink.download = `auditor-lab-${demo.example.id}.json`;
    results.hidden = false;
    progress.textContent = 'Gotowe. Wyświetlono raport dla przykładu syntetycznego.';
    get('results-title').focus();
  } catch (error) {
    if (pending === task) {
      progress.textContent = error.name === 'TimeoutError'
        ? 'Przekroczono czas oczekiwania na demo. Spróbuj ponownie.'
        : `Nie udało się uruchomić demo. ${error.message}`;
    }
  } finally {
    if (pending === task) {
      pending = null;
      run.disabled = false;
    }
  }
});
