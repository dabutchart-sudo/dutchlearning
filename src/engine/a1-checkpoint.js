// The integrated A1 checkpoint is not a study topic in this slice.
// It stays closed until the missing course topics exist, every earlier topic
// is retained, and a later slice adds the unseen written check.
export const A1_CHECKPOINT_ID='A1.26';
export const A1_CHECKPOINT_TOPICS=Object.freeze(['A1.23','A1.24','A1.25']);

function conceptMap(content){
 const concepts=content?.concepts||[];
 return content?.conceptById||Object.fromEntries(concepts.map(concept=>[concept.id,concept]));
}

export function a1CheckpointReadiness(state,content){
 const byId=conceptMap(content);
 const concepts=content?.concepts||Object.values(byId);
 const missingTopics=A1_CHECKPOINT_TOPICS.filter(id=>!byId[id]);
 const required=[...new Set([...concepts.map(concept=>concept.id).filter(id=>id!==A1_CHECKPOINT_ID),...A1_CHECKPOINT_TOPICS])];
 const notRetained=required.filter(id=>byId[id]&&!state?.progress?.[id]?.masteredAt);
 const topicLabels={'A1.23':'requests and service Dutch','A1.24':'connecting ideas','A1.25':'daily-life consolidation'};
 const names=missingTopics.map(id=>topicLabels[id]||id);
 const missingPhrase=names.length<=1?names[0]||'the remaining topics':names.length===2?`${names[0]} and ${names[1]}`:`${names.slice(0,-1).join(', ')}, and ${names.at(-1)}`;
 let stage,summary;
 if(missingTopics.length){
  stage='waiting-for-topics';
  summary=`This checkpoint is not open yet. It waits until ${missingPhrase} ${names.length===1?'is':'are'} in the course, and every earlier topic is retained. Passing it will be Zin’s record of retained A1 capability, not an official certificate.`;
 }else if(notRetained.length){
  stage='waiting-for-retention';
  summary='This checkpoint is not open yet. Every earlier topic still needs its delayed retention check. Passing it will be Zin’s record of retained A1 capability, not an official certificate.';
 }else{
  stage='waiting-for-material';
  summary='This checkpoint is not open yet. Its unseen written check is not part of the course. Passing it will be Zin’s record of retained A1 capability, not an official certificate.';
 }
 return Object.freeze({
  id:A1_CHECKPOINT_ID,open:false,officialQualification:false,singleScore:false,
  stage,missingTopics:Object.freeze([...missingTopics]),notRetained:Object.freeze([...notRetained]),summary
 });
}
