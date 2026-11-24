import {audit} from '../src/lib/auditor/core.mjs';
import {extractWithOpenAI} from '../src/lib/auditor/openai-extractor.mjs';

const documents = [
  {id:'HLD', text:'Przepływ płatności: komunikaty RabbitMQ mogą zostać dostarczone więcej niż raz. Konsument ponawia przetwarzanie przy błędzie.'},
  {id:'ADR-001', text:'Przepływ płatności: każda płatność ma zostać wykonana dokładnie jeden raz. Nie opisano sposobu deduplikacji komunikatów.'}
];
const sample = {
  flows:[{id:'payment',name:'Przepływ płatności',documentId:'HLD',quote:'Przepływ płatności: komunikaty RabbitMQ mogą zostać dostarczone więcej niż raz.'}],
  claims:[
    {id:'C1',flowId:'payment',kind:'possible_duplicate_delivery',documentId:'HLD',quote:'komunikaty RabbitMQ mogą zostać dostarczone więcej niż raz.'},
    {id:'C2',flowId:'payment',kind:'exactly_once_requirement',documentId:'ADR-001',quote:'każda płatność ma zostać wykonana dokładnie jeden raz.'}
  ]
};
const useLiveAI = process.argv.includes('--live');
const extraction = useLiveAI
  ? await extractWithOpenAI(documents,{apiKey:process.env.OPENAI_API_KEY})
  : sample;
console.log(JSON.stringify(audit(documents,extraction),null,2));
