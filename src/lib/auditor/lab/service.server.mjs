import {audit} from '../core.mjs';
import {benchmark, fixtureOptions} from '../../../../tests/fixtures/auditor-benchmark.mjs';

export const examples = [
  {id:'documented-protection', label:'Ochrona przed podwójnym obciążeniem'},
  {id:'missing-protection', label:'Brak opisu zabezpieczenia'},
  {id:'confirmed-violation', label:'Potwierdzone podwójne obciążenie'},
  {id:'negated-premise', label:'Brak przesłanki do oceny'},
  {id:'other-flow', label:'Zabezpieczenie innego przepływu'},
  {id:'rejected-effect', label:'Niepotwierdzony zakres dowodu'}
];

export function runDemo(id) {
  if (!examples.some(example => example.id === id)) return null;
  const {description, documents, expectedFacts, reviews} = benchmark.find(example => example.id === id);
  return {
    mode:'synthetic-demo',
    example:{id, description},
    documents,
    report:audit(documents, expectedFacts, fixtureOptions(reviews))
  };
}
