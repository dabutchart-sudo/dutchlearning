import {spellingBlocked} from './word-recall.js';
import {hash,normalize} from './util.js';
export function itemPriority(item,state){
 const recent=state.exposures.slice(-20);let weight=10 + item.vocabulary.filter(w=>w.mature).length * .3;
 for(const x of recent){const age=recent.length-recent.indexOf(x);weight-=x.nl===normalize(item.nl)?40/age:0;weight-=x.verb===item.verb?12/age:0;weight-=x.subject===item.subject?7/age:0;weight-=x.family===item.family?5/age:0;for(const w of item.vocabulary)if(x.words.includes(w.id))weight-=3/age;}
 for(const w of item.vocabulary)weight+=(state.words[w.id]?.weakness||0)*2;
 weight+=(state.progress[item.concept]?.weakness||0)*2;
 return weight+hash(item.id+state.attempts.length)%1000/1000;
}
export function practiceKind(p,canListen=false){
 if(p.recognised<4)return p.practiceAttempts%2?'correct-sentence':'choice';
 if(p.constructed<4)return ['wordbank','gap','form'][p.practiceAttempts%3];
 if(p.weakness>=4)return ['wordbank','gap','typed'][p.practiceAttempts%3];
 const cycle=['typed','typed','wordbank','typed','correction','form','typed','gap','correct-sentence',canListen?'listening':'choice'];
 return cycle[p.practiceAttempts%cycle.length];
}
export function selectPractice(state,content,current,date,canListen){
 const allMastered=content.concepts.every(c=>state.progress[c.id].masteredAt);
 const maintenance=content.concepts.filter(c=>state.progress[c.id].masteredAt&&(allMastered||state.progress[c.id].nextMaintenance<=date));
 let concept=current;let phase='practice';
 if(maintenance.length&&(state.daily.count%5===4||state.progress[current].status==='mastered')){concept=maintenance.sort((a,b)=>state.progress[a.id].nextMaintenance.localeCompare(state.progress[b.id].nextMaintenance))[0].id;phase='maintenance'}
 const due=state.retries.find(r=>r.after<=state.attempts.length&&(!r.date||r.date<=date));
 if(due&&state.progress[due.concept].taught){concept=due.concept;phase=state.progress[concept].masteredAt?'maintenance':'practice';}
 let pool=content.sentences.filter(x=>x.concept===concept&&x.pool==='practice');
 if(due&&due.concept===concept){const focused=pool.filter(x=>x.verb===due.verb&&x.id!==due.sourceId&&!state.exposures.slice(-2).some(e=>e.nl===normalize(x.nl)));if(focused.length)pool=focused;}
 let kind=phase==='maintenance'&&state.progress[concept].status!=='reinforcement'?'typed':practiceKind(state.progress[concept],canListen);
 const eligible=pool.filter(item=>!spellingBlocked(state,item,kind));
 if(eligible.length)pool=eligible;
 else {
  const alternatives=content.sentences.filter(item=>item.concept===concept&&item.pool==='practice'&&!spellingBlocked(state,item,kind));
  if(alternatives.length)pool=alternatives;else kind='wordbank';
 }
 const item=[...pool].sort((a,b)=>itemPriority(b,state)-itemPriority(a,state))[0];
 if(!item)throw Error('No practice content available');
 return {item,kind,phase,retryId:due?.id};
}
export function selectProof(state,content,concept,count){
 const seen=new Set(state.exposures.map(x=>x.nl));
 const candidates=content.sentences.filter(x=>x.concept===concept&&x.pool==='proof'&&!seen.has(normalize(x.nl)));
 const picked=[];const temp={...state,exposures:[...state.exposures]};
 while(picked.length<count&&candidates.length){candidates.sort((a,b)=>itemPriority(b,temp)-itemPriority(a,temp));const x=candidates.shift();picked.push(x);temp.exposures.push({nl:normalize(x.nl),verb:x.verb,subject:x.subject,family:x.family,words:x.vocabulary.map(w=>w.id)});}
 if(picked.length!==count)throw Error('Not enough unseen proof sentences remain in this pack. Add a content pack before another test; seen questions will never be recycled as unseen.');
 return picked;
}
