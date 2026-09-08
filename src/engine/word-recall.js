import {normalize,tokens} from './util.js';
export const spellingKinds=new Set(['typed','gap','correction']);
const practice=q=>['practice','maintenance'].includes(q.phase);
// Canonical dictionary text unifies inflections and duplicate card IDs across packs.
export function wordTargets(item,kind){
 const sentence=tokens(item.nl),targets=[];
 for(const word of item.vocabulary){
  const key=normalize(word.nl),parts=tokens(word.nl);
  let indices=[];
  if(key===normalize(item.verb)&&item.concept==='A1.6')indices=(item.verbSlots||[]).filter(i=>i!==item.verbIndex);
  else if(key===normalize(item.verb))indices=(item.verbSlots||[item.verbIndex]).filter(i=>sentence[i]&&(item.forms.map(normalize).includes(sentence[i])||sentence[i]===key));
  else for(let i=0;i<sentence.length;i++)if(parts.every((w,j)=>sentence[i+j]===w))indices.push(...parts.map((_,j)=>i+j));
  if(kind==='gap')indices=indices.filter(i=>i===item.verbIndex);
  if(indices.length)targets.push({key,indices});
 }
 return targets;
}
export function recallEvidence(q,item,result){
 const targets=wordTargets(item,q.kind),typed=spellingKinds.has(q.kind)&&!q.assisted;
 const failed=typed?targets.filter(t=>t.indices.some(i=>result.lexicalErrors.includes(q.kind==='gap'?0:i))).map(t=>t.key):[];
 return {attempted:typed?targets.map(t=>t.key):[],failed,successful:typed&&result.grammar===true?targets.filter(t=>!failed.includes(t.key)).map(t=>t.key):[],supported:typed?[]:targets.map(t=>t.key)};
}
export function recordRecall(state,q,evidence){
 if(!practice(q))return;
 state.wordStruggles??={};
 for(const key of evidence.failed){const word=state.wordStruggles[key]??={failures:0,needsReintroduction:false};word.failures++;word.lastFailure=state.daily.date;}
 for(const key of evidence.successful)if(state.wordStruggles[key])state.wordStruggles[key].needsReintroduction=false;
 for(const key of evidence.failed)if(sessionFailures(state,key)>=3)state.wordStruggles[key].needsReintroduction=true;
}
function encounters(state,key){return state.attempts.filter(a=>a.date===state.daily.date&&practice(a)&&a.wordEvidence&&[...a.wordEvidence.attempted,...a.wordEvidence.supported].includes(key));}
function sessionFailures(state,key){return encounters(state,key).filter(a=>a.wordEvidence.failed.includes(key)).length;}
export function wordBlocked(state,key){
 const recent=encounters(state,key),failures=recent.filter(a=>a.wordEvidence.failed.includes(key)).length;
 if(failures>=3)return true;
 // Previously saturated words get one independent attempt; success releases the limit.
 if(state.wordStruggles?.[key]?.needsReintroduction&&failures>=1)return true;
 // After the second miss, require a supported encounter before testing again.
 return failures>=2&&!!recent.at(-1)?.wordEvidence.failed.includes(key);
}
export function spellingBlocked(state,item,kind){return spellingKinds.has(kind)&&wordTargets(item,kind).some(t=>wordBlocked(state,t.key));}
