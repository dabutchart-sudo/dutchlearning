import {tokens,normalize} from '../engine/util.js';
import {formatKinds} from '../engine/question-formats.js';

const inScope=id=>/^A1\.(?:[7-9]|1\d|2[01])$/.test(id);

export function auditA1Fairness(content){
 const errors=[],unpractisedProof=[];
 const allowed=new Set(formatKinds);
 const previouslyPractised=new Set();
 for(const concept of content.concepts){
  const rows=content.sentences.filter(s=>s.concept===concept.id);
  const practice=rows.filter(s=>s.pool==='practice');
  const proof=rows.filter(s=>s.pool==='proof');
  if(inScope(concept.id)){
   const prompts=new Map();
   for(const row of rows){
    if(!row.en?.trim())errors.push(`${row.id}: missing English sentence meaning`);
    const sentence=tokens(row.nl),inventory=new Set((row.vocabulary||[]).flatMap(w=>tokens(w.nl)));
    for(const word of sentence)if(!inventory.has(word))errors.push(`${row.id}: missing vocabulary word ${word}`);
    for(const word of row.vocabulary||[])if(!word.en?.trim())errors.push(`${row.id}: missing English meaning for ${word.nl}`);
    if(row.verbIndex<0||row.verbIndex>=sentence.length||!row.forms?.some(form=>normalize(form)===sentence[row.verbIndex]))errors.push(`${row.id}: invalid finite-verb metadata`);
    if((row.verbSlots||[]).some(index=>index<0||index>=sentence.length))errors.push(`${row.id}: invalid verb slot`);
    if(!row.suitableKinds?.length||row.suitableKinds.some(k=>!allowed.has(k)))errors.push(`${row.id}: invalid suitableKinds`);
    if(row.pool==='proof'&&!['choice','typed'].every(k=>row.suitableKinds?.includes(k)))errors.push(`${row.id}: proof needs choice and typed`);
    const prompt=normalize(row.englishPrompt||row.en),earlier=prompts.get(prompt);
    if(earlier&&normalize(earlier.nl)!==normalize(row.nl))errors.push(`${row.id}: ambiguous English prompt shared with ${earlier.id}`);
    else prompts.set(prompt,row);
   }
   const familiar=new Set([...previouslyPractised,...practice.flatMap(s=>tokens(s.nl))]);
   for(const row of proof){
    const missing=[...new Set(tokens(row.nl).filter(w=>!familiar.has(w)))];
    if(missing.length)unpractisedProof.push({id:row.id,concept:concept.id,words:missing});
   }
  }
  for(const row of practice)for(const word of tokens(row.nl))previouslyPractised.add(word);
 }
 return {errors,unpractisedProof};
}
