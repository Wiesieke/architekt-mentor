const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { transformSync } = require('esbuild');
const source = fs.readFileSync('src/components/Comments.astro', 'utf8').split('<script>')[1].split('</script>')[0];
const code = transformSync(source, { loader: 'ts' }).code;
class Element {
  constructor(tag) { this.tag = tag; this.dataset = {}; this.children = []; this.textContent = ''; }
  append(...items) { this.children.push(...items); }
  prepend(item) { this.children.unshift(item); }
  replaceChildren(...items) { this.children = items; this.textContent = ''; }
  querySelector(selector) { return this.nodes?.[selector] || (selector === 'article' ? this.children.find(item => item.tag === 'article') : null); }
  addEventListener(event, fn) { this[event] = fn; }
  scrollIntoView() { this.scrolled = true; }
  focus() { this.focused = true; }
}
async function run(status, locale = 'pl') {
  const list = new Element('div'), form = new Element('form'), notice = new Element('p'), button = new Element('button');
  form.nodes = { '.form-status': notice, 'button[type=submit]': button };
  form.reset = () => { form.resets = (form.resets || 0) + 1; };
  const section = new Element('section');
  section.dataset = { article: '/podstawy-architektury/adr/', locale };
  section.nodes = { '.comment-list': list, form };
  let releaseList;
  const delayedList = new Promise(resolve => { releaseList = resolve; });
  const comment = { id: 'published-id', display_name: 'Reader', body: '<script>untrusted</script> constructive question' };
  vm.runInNewContext(code, {
    document: { querySelectorAll: () => [section], createElement: tag => new Element(tag) },
    FormData: class { get(key) { return key === 'message' ? comment.body : 'value'; } },
    window: { turnstile: { reset() {} } },
    fetch: async (url, options) => options?.method === 'POST'
      ? { ok: true, json: async () => ({ status, ...(status === 'approved' ? { comment } : {}) }) }
      : delayedList,
  });
  await form.submit({ preventDefault() {} });
  releaseList({ ok: true, json: async () => ({ comments: [] }) });
  await new Promise(resolve => setImmediate(resolve));
  return { list, form, notice, button, comment };
}
for (const locale of ['pl', 'en']) {
  test(locale + ': confirmed comment appears immediately and survives a stale initial list', async () => {
    const { list, form, button, comment } = await run('approved', locale);
    assert.equal(list.children.length, 1);
    const published = list.children[0];
    assert.equal(published.dataset.commentId, comment.id);
    assert.equal(published.children[1].textContent, comment.body);
    assert.ok(published.scrolled && published.focused);
    assert.equal(form.resets, 1); assert.equal(button.disabled, false);
  });
  test(locale + ': rejected comment stays editable and is never shown publicly', async () => {
    const { list, form, notice } = await run('rejected', locale);
    assert.equal(list.children.length, 0); assert.equal(form.resets, undefined);
    assert.match(notice.textContent, locale === 'pl' ? /Popraw tekst/ : /Edit the text/);
  });
  test(locale + ': manual review is disclosed and no public comment is inserted', async () => {
    const { list, form, notice } = await run('pending', locale);
    assert.equal(list.children.length, 0); assert.equal(form.resets, 1);
    assert.match(notice.textContent, locale === 'pl' ? /moderatora/ : /moderator/);
  });
}
