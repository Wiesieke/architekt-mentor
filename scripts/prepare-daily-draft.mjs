import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const run=(cmd,args,opts={})=>execFileSync(cmd,args,{encoding:'utf8',stdio:['ignore','pipe','pipe'],...opts}).trim();
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const branch='editorial/auto-daily-'+date;
const marker='ArchitectMentor automated daily candidate '+date;
const issue=(title,body)=>{try{run('gh',['issue','create','--title',title,'--body',body]);}catch(e){console.error('Unable to create diagnostic issue:',String(e.stderr||e));}};
const existing=JSON.parse(run('gh',['pr','list','--state','all','--json','headRefName,number,url']));
if(existing.some(p=>p.headRefName===branch)){console.log('Existing PR found; not duplicating:',branch);process.exit(0);}
if(!process.env.OPENAI_API_KEY){issue('Daily blocked '+date,'OPENAI_API_KEY is not configured for GitHub Actions. No draft was generated. Configure the secret; do not bypass editorial gates.');process.exit(1);}
const topics=[
  'Designing a deadline budget across synchronous dependencies',
  'When to choose an outbox instead of dual writes',
  'How to prove that a service boundary is correctly placed',
  'When to use a circuit breaker and when not to',
  'Why a successful health check may not prove a completed business journey',
  'How to design a safe idempotency contract',
  'How to choose a consistency model for read replicas'
];
const index=Math.floor(Date.parse(date+'T00:00:00Z')/86400000)%topics.length;
const prompt='Create ONE original bilingual ArchitectMentor educational DRAFT about: '+topics[index]+'. Fictional educational scenario only. No claims about recent news, real incidents, or verified external sources. Explain context, constraints, 3 options, conditional decision, consequences and testable acceptance criteria. Each language 300-500 words. Return strict JSON object with keys title_pl,title_en,body_pl,body_en. Markdown body text, no code fences. Do not claim publication, human review, or verified sources.';
const res=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',input:prompt,max_output_tokens:3200})});
if(!res.ok){issue('Daily generation failed '+date,'OpenAI Responses API returned HTTP '+res.status+'. Check billing, key and quota. No publication was attempted.');throw Error('Generation failed HTTP '+res.status);}
const json=await res.json();
const output=(json.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
let draft;try{draft=JSON.parse(output);}catch{issue('Daily invalid output '+date,'Generated draft was not valid JSON. No publication was attempted.');throw Error('Invalid model output');}
for(const key of ['title_pl','title_en','body_pl','body_en'])if(typeof draft[key]!=='string'||draft[key].length<30)throw Error('Missing or too short: '+key);
run('git',['config','user.name','github-actions[bot]']);run('git',['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
run('git',['checkout','-b',branch]);
fs.mkdirSync('docs/drafts',{recursive:true});
fs.writeFileSync('docs/drafts/'+date+'-automated-pl.md','# '+draft.title_pl+'\n\n> Fikcyjny scenariusz edukacyjny. Szkic wymagający kontroli.\n\n'+draft.body_pl+'\n');
fs.writeFileSync('docs/drafts/'+date+'-automated-en.md','# '+draft.title_en+'\n\n> Fictional educational scenario. Draft pending verification.\n\n'+draft.body_en+'\n');
run('git',['add','docs/drafts']);run('git',['commit','-m',marker]);run('git',['push','--set-upstream','origin',branch]);
run('gh',['pr','create','--draft','--base','main','--head',branch,'--title','Daily draft '+date+': '+draft.title_en,'--body','Automated PL/EN editorial candidate only. NOT ready to publish. Check originality, confidentiality, PL/EN parity, add public Astro pages and editions.ts, pass CI, verify authorized Vercel Preview and production after merge. Publication authorization: docs/publication-authorization.json. Human reviewer: null.']);
console.log('Draft PR created; publication intentionally not bypassed.');
