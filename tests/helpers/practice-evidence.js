// Progression fixtures skip the 40 individual practice submissions. Preserve
// the completed-practice evidence that the personal-vocabulary rule requires.
import {addDays} from '../../src/engine/util.js';

export function seedTypedReadiness(state,concept,today=state.daily?.date||'2026-09-23'){
 for(let index=0;index<10;index++){
  const id=`fixture-typed:${concept}:${index}`;
  if(state.attempts.some(attempt=>attempt.id===id))continue;
  const date=addDays(today,index<5?-2:-1);
  state.attempts.push({id,concept,phase:'practice',kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true,date,
   occurredAt:`${date}T12:${String(index).padStart(2,'0')}:00Z`});
 }
}

export function seedCompletedPractice(state,content,throughConcept){
 for(const concept of content.concepts){
  for(const item of content.sentences.filter(row=>row.concept===concept.id&&row.pool==='practice')){
   const id=`fixture-practice:${item.id}`;
   if(!state.attempts.some(attempt=>attempt.id===id))
    state.attempts.push({id,sourceId:item.id,concept:item.concept,phase:'practice',correctSentence:item.nl});
  }
  if(concept.id===throughConcept)break;
 }
 // These progression fixtures also stand in for independent typed practice
 // that would have happened over two earlier study days before a first proof.
 seedTypedReadiness(state,throughConcept);
}
