// Preflight for an Astro static export on Cloudflare Pages.
// Run after 'npm run build'; does not deploy or publish anything.
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'en/index.html', 'pl/index.html', '_redirects', '_routes.json',
  '404.html', 'sitemap.xml'
];
const missing = required.filter(name => !existsSync(join('dist',name)));
if(missing.length) {
  console.error('Cloudflare static preflight failed. Missing: '+missing.join(', '));
  process.exit(1);
}
const routes=JSON.parse(readFileSync(join('dist','_routes.json'),'utf8'));
if(routes.version!==1 || JSON.stringify(routes.include)!=='["/api/*"]') {
  throw Error('Pages Functions must only execute on /api/*.');
}
const redirects=readFileSync(join('dist','_redirects'),'utf8');
if(!redirects.split(/\r?\n/).some(line=>line.trim()==='/ /en/ 302')) {
  throw Error('Missing root-language fallback redirect.');
}
let count=0, large=[];
function visit(dir) {
  for(const item of readdirSync(dir,{withFileTypes:true})) {
    const path=join(dir,item.name);
    if(item.isDirectory())visit(path);
    else if(item.isFile()) {
      count++;
      if(statSync(path).size>25*1024*1024)large.push(path);
    }
  }
}
visit('dist');
if(large.length)throw Error('Files above 25 MiB: '+large.join(', '));
if(count>20000)throw Error('Static file count exceeds 20,000.');
console.log('Cloudflare static preflight OK: '+count+' files; API isolated on /api/*.');
