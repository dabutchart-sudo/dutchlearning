import {normalize} from '../engine/util.js';

// DAB-184: versioned F1 recovery contexts. Every verb and subject already appears in F1.
// The eight practice rows introduce "nu" before any new proof row using it is eligible.
const GERUNDS={
 werken:'working',lopen:'walking',schrijven:'writing',lezen:'reading',spelen:'playing',
 dansen:'dancing',zwemmen:'swimming',zingen:'singing',slapen:'sleeping',wachten:'waiting',
 bellen:'calling',luisteren:'listening',praten:'talking',rennen:'running',rijden:'driving',
 studeren:'studying',tekenen:'drawing',lachen:'laughing',huilen:'crying',leren:'learning'
};
const SUBJECTS={
 Ik:'I am',Jij:'You are',Hij:'He is',Zij:'She is',Wij:'We are',
 Jullie:'You (plural) are','De man':'The man is','De vrouwen':'The women are'
};
const PRACTICE=new Set([
 'werken|Ik','lopen|Wij','schrijven|Jij','lezen|Hij',
 'spelen|Zij','dansen|Jullie','wachten|De man','praten|De vrouwen'
]);
const NU={id:'word:nu',nl:'nu',en:'now',mature:false};

export function f1ProofRecoveryRows(existing){
 const models=new Map(existing.filter(item=>item.concept==='F1').map(item=>[`${item.verb}|${item.subject}`,item]));
 const seen=new Set(existing.map(item=>normalize(item.nl)));
 const rows=[];
 for(const [verb,gerund] of Object.entries(GERUNDS))for(const [subject,englishSubject] of Object.entries(SUBJECTS)){
  const model=models.get(`${verb}|${subject}`);
  if(!model)throw Error(`F1 recovery is missing ${verb} with ${subject}`);
  const nl=`${model.nl.replace(/[.!?]$/,'')} nu.`;
  if(seen.has(normalize(nl)))throw Error(`F1 recovery repeats ${nl}`);
  seen.add(normalize(nl));
  const practice=PRACTICE.has(`${verb}|${subject}`);
  rows.push({
   ...model,
   id:`f1-recovery-v1-${verb}-${subject.toLocaleLowerCase('nl-NL').replace(/\s+/g,'-')}`,
   nl,en:`${englishSubject} ${gerund} now.`,
   pool:practice?'practice':'proof',
   difficulty:2,
   vocabulary:[...model.vocabulary,NU],
   suitableKinds:practice?model.suitableKinds:['choice','typed'],
   requiresPractice:!practice,
   expectedStructure:'subject finite-verb adverb'
  });
 }
 return rows;
}
