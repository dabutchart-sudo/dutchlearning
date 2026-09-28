// Progression fixtures skip the 40 individual practice submissions. Preserve
// the completed-practice evidence that the personal-vocabulary rule requires.
export function seedCompletedPractice(state,content,throughConcept){
 for(const concept of content.concepts){
  for(const item of content.sentences.filter(row=>row.concept===concept.id&&row.pool==='practice')){
   const id=`fixture-practice:${item.id}`;
   if(!state.attempts.some(attempt=>attempt.id===id))
    state.attempts.push({id,sourceId:item.id,concept:item.concept,phase:'practice',correctSentence:item.nl});
  }
  if(concept.id===throughConcept)break;
 }
}
