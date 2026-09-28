import {normalize,tokens} from '../engine/util.js';

const inScope=id=>/^A1\.(?:[7-9]|1\d|2[01])$/.test(id);

// Count only sentences that remain fresh if all earlier course content was seen.
// A duplicate proof sentence is never credited twice, even within one topic.
export function auditA1ProofCapacity(content){
 const report=[];
 const earlierText=new Set();
 const practised=new Set();
 for(const concept of content.concepts){
  const rows=content.sentences.filter(row=>row.concept===concept.id);
  const practice=rows.filter(row=>row.pool==='practice');
  const currentPractice=new Set(practice.map(row=>normalize(row.nl)));
  const familiar=new Set([...practised,...practice.flatMap(row=>tokens(row.nl))]);
  if(inScope(concept.id)){
   const proof=rows.filter(row=>row.pool==='proof');
   const local=new Set();
   const duplicates=[],exposureCollisions=[],unpractised=[],effective=[];
   for(const row of proof){
    const text=normalize(row.nl);
    if(local.has(text)){duplicates.push(row.id);continue;}
    local.add(text);
    if(earlierText.has(text)||currentPractice.has(text)){exposureCollisions.push(row.id);continue;}
    if(tokens(row.nl).some(word=>!familiar.has(word))){unpractised.push(row.id);continue;}
    effective.push(row.id);
   }
   report.push({concept:concept.id,total:proof.length,effective:effective.length,
    duplicates,exposureCollisions,unpractised,shortfall:Math.max(0,90-effective.length)});
  }
  for(const row of rows)earlierText.add(normalize(row.nl));
  for(const row of practice)for(const word of tokens(row.nl))practised.add(word);
 }
 return report;
}
