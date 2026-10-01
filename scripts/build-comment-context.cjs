// Use the built publication as authoritative context; visitors cannot supply it.
const fs = require('node:fs');
const path = require('node:path');
const { validPath } = require('../api/_comments');
const contexts = {};
const plain = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === 'index.html') {
      const url = '/' + path.relative('dist', directory).split(path.sep).join('/') + '/';
      if (!validPath(url, url.startsWith('/en/') ? 'en' : 'pl')) continue;
      const html = fs.readFileSync(file, 'utf8');
      const title = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
      const body = html.match(/<article\b[^>]*class="(?:article-body|body)"[^>]*>([\s\S]*?)<\/article>/i)?.[1];
      if (!title || !body) throw new Error('Missing moderation context: ' + url);
      contexts[url] = { title: plain(title), text: plain(body).slice(0, 12000) };
    }
  }
}
walk('dist');
if (!Object.keys(contexts).length) throw new Error('No comment contexts generated');
fs.writeFileSync('api/_comment-context.json', JSON.stringify(contexts));
console.log('Generated moderation context for ' + Object.keys(contexts).length + ' articles');
