import {normalize} from '../engine/util.js';

// Existing F2 subject/verb/object combinations in a familiar "nu" context.
// New proof rows require completed practice of every word; old proof eligibility stays intact.
const CONTEXTS=[
 ['lezen','een boek','reading a book'],['lezen','de krant','reading the newspaper'],
 ['lezen','een brief','reading a letter'],['kopen','een fiets','buying a bicycle'],
 ['kopen','een huis','buying a house'],['drinken','water','drinking water'],
 ['drinken','thee','drinking tea'],['drinken','koffie','drinking coffee'],
 ['maken','een tekening','making a drawing'],['gebruiken','de computer','using the computer'],
 ['gebruiken','een pen','using a pen'],['sluiten','de deur','closing the door'],
 ['sluiten','het raam','closing the window'],['openen','de deur','opening the door']
];
const SUBJECTS={Ik:'I am',Jij:'You are',Hij:'He is',Zij:'She is',Wij:'We are',Jullie:'You (plural) are','De man':'The man is','De vrouwen':'The women are'};
const INTRODUCTIONS=new Set(['lezen|een boek|Ik','kopen|een fiets|Wij','drinken|water|Hij','gebruiken|een pen|Zij']);
const NU={id:'word:nu',nl:'nu',en:'now',mature:false};

export function f2ProofRecoveryRows(existing){
 const models=existing.filter(row=>row.concept==='F2');
 const seen=new Set(existing.map(row=>normalize(row.nl))),rows=[];
 for(const [verb,object,english] of CONTEXTS)for(const [subject,prefix] of Object.entries(SUBJECTS)){
  const model=models.find(row=>row.verb===verb&&row.subject===subject&&row.nl.endsWith(` ${object}.`));
  if(!model)throw Error(`F2 recovery is missing ${subject} ${verb} ${object}`);
  const words=model.nl.split(' ');words.splice(model.verbIndex+1,0,'nu');
  const nl=words.join(' ');
  if(seen.has(normalize(nl)))throw Error(`F2 recovery repeats ${nl}`);
  seen.add(normalize(nl));
  const practice=INTRODUCTIONS.has(`${verb}|${object}|${subject}`);
  rows.push({...model,
   id:`f2-recovery-v1-${verb}-${object}-${subject}`.toLocaleLowerCase('nl-NL').replace(/\s+/g,'-'),
   legacyId:undefined,nl,en:`${prefix} ${english} now.`,alternatives:[],
   pool:practice?'practice':'proof',suitableKinds:practice?['choice','wordbank','typed']:['choice','typed'],
   requiresPractice:!practice,vocabulary:[...model.vocabulary,NU],
   expectedStructure:'subject finite-verb adverb object'
  });
 }
 return rows;
}
