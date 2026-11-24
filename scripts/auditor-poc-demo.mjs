import {audit} from '../src/lib/auditor/core.mjs';
import {extractWithOpenAI} from '../src/lib/auditor/openai-extractor.mjs';
import {benchmark, fixtureOptions} from '../tests/fixtures/auditor-benchmark.mjs';

const {documents, expectedFacts, reviews} = benchmark.find(({id}) => id === 'missing-protection');
const useLiveAI = process.argv.includes('--live');
const report = useLiveAI
  ? audit(documents, await extractWithOpenAI(documents,{apiKey:process.env.OPENAI_API_KEY}))
  : audit(documents, expectedFacts, fixtureOptions(reviews));
console.log(JSON.stringify(report,null,2));
