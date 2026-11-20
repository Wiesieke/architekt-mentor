const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const data = require('../src/data/weekly-decision.json');
const modulePromise = import('../src/lib/weekly-decision.mjs');
test('Weekly PL/EN option IDs and preferred choice match', () => {
  for (const locale of ['pl', 'en']) {
    assert.deepEqual(data[locale].options.map(o => o.id), ['A', 'B', 'C']);
    for (const o of data[locale].options) assert(o.text.length > 30 && o.explanation.length > 80);
  }
  assert.equal(data.correctId, 'B');
});
for (const locale of ['pl', 'en']) {
  test(`Weekly ${locale}: absent/invalid choice gives guidance; all choices and retries give exact feedback`, async () => {
    const { evaluateChoice } = await modulePromise;
    for (const id of [undefined, null, '', 'D', '<script>']) {
      assert.deepEqual(evaluateChoice(data[locale], id, data.correctId), {status:'missing',message:data[locale].missing});
    }
    for (const id of ['A', 'B', 'C', 'A', 'B']) {
      const r = evaluateChoice(data[locale], id, data.correctId);
      assert.equal(r.status, id === 'B' ? 'best' : 'conditional');
      assert(r.message.includes(data[locale].options.find(o => o.id === id).explanation));
      assert.equal(r.score, undefined);
    }
  });
}
// Event-contract fake, not a rendering or accessibility test.
function element(dataset = {}) {
  return {dataset,hidden:false,value:'',attrs:{},listeners:{},focused:false,
    addEventListener(t, cb) {this.listeners[t] = cb;},
    setAttribute(k, v) {this.attrs[k] = v;}, focus() {this.focused = true;},
    click() {this.listeners.click({currentTarget:this});}};
}
test('Weekly mode changes preserve drafts/choice; hint toggles and feedback/follow-up focus work', async () => {
  const { mountDecision } = await modulePromise;
  const q=element(), m=element(), f=element(), h=element(), follow=element();
  const qb=element({mode:'quick'}), mb=element({mode:'mentor'});
  const check=element(), hb=element(), question=element(), revised=element(), selected=element();
  const initial=element(); initial.value='Retain compatible worker'; revised.value='Check duplicates'; selected.value='C';
  h.hidden=follow.hidden=true;
  const nodes={'[data-quick]':q,'[data-mentor]':m,'[data-feedback]':f,'[data-hint]':h,
    '[data-followup]':follow,'[data-check]':check,'[data-hint-button]':hb,
    '[data-question-button]':question,'[data-followup-answer]':revised,
    'input[name="weekly-choice"]:checked':selected};
  mountDecision({querySelector:s=>nodes[s],querySelectorAll:()=>[qb,mb]},data.en,data.correctId);
  mb.click(); assert(q.hidden && !m.hidden); assert.equal(mb.attrs['aria-pressed'],'true');
  question.click(); assert(!follow.hidden && revised.focused);
  qb.click(); assert(!q.hidden && m.hidden);
  assert.equal(initial.value,'Retain compatible worker'); assert.equal(revised.value,'Check duplicates'); assert.equal(selected.value,'C');
  check.click(); assert.equal(f.dataset.status,'conditional'); assert(f.focused);
  hb.click(); assert(!h.hidden); assert.equal(hb.attrs['aria-expanded'],'true');
  hb.click(); assert(h.hidden);
});
test('Weekly remains preview-only/noindex; no networking or draft persistence in interaction', () => {
  const route=fs.readFileSync('src/pages/redakcja/weekly-candidate/[locale].astro','utf8');
  const logic=fs.readFileSync('src/lib/weekly-decision.mjs','utf8');
  const component=fs.readFileSync('src/components/WeeklyDecision.astro','utf8');
  assert(route.includes("process.env.VERCEL_ENV === 'preview'")); assert(route.includes('noindex,nofollow'));
  assert(component.includes('id="weekly-initial"') && component.includes('id="weekly-followup-answer"'));
  assert(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/.test(logic+component));
});
