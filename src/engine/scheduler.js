import {spellingBlocked} from './word-recall.js';
import {hash,normalize} from './util.js';
import {eligibleProof,practiceVocabularyGain} from './proof-vocabulary.js';
export function itemPriority(item,state){
 const recent=state.exposures.slice(-20);let weight=10 + item.vocabulary.filter(w=>w.mature).length * .3;
 for(const x of recent){const age=recent.length-recent.indexOf(x);weight-=x.nl===normalize(item.nl)?40/age:0;weight-=x.verb===item.verb?12/age:0;weight-=x.subject===item.subject?7/age:0;weight-=x.family===item.family?5/age:0;for(const w of item.vocabulary)if(x.words.includes(w.id))weight-=3/age;}
 for(const w of item.vocabulary)weight+=(state.words[w.id]?.weakness||0)*2;
 weight+=(state.progress[item.concept]?.weakness||0)*2;
 return weight+hash(item.id+state.attempts.length)%1000/1000;
}
export function practiceContextWeight(item){
 const count=normalize(item.nl).split(/\s+/).filter(Boolean).length;
 if(count>=4&&count<=8)return 6;
 if(count===3)return 2;
 if(count<=2)return -6;
 return 0;
}
export function practiceSession(state,phase='practice'){
 const date=state.daily?.date;
 const today=(state.attempts||[]).filter(a=>a.date===date&&a.phase!=='extra');
 return {
  dailyCount:state.daily?.count||0,
  heardToday:!!(state.daily?.listeningBeat||today.some(a=>a.kind==='listening')),
  spokenToday:!!(state.daily?.speakingBeat||today.some(a=>a.kind==='speaking')),
  phase,
  proof:!!state.proof
 };
}
export function sessionBeatKind(p,canListen=false,canSpeak=false,session=null){
 if(!session||session.proof||session.phase==='extra')return null;
 if(p.recognised<4||p.constructed<4||p.weakness>=4)return null;
 const remaining=Math.max(0,20-(session.dailyCount||0));
 const needL=canListen&&!session.heardToday;
 const needS=canSpeak&&!session.spokenToday;
 if(!needL&&!needS)return null;
 if(session.phase==='maintenance'&&remaining>(needL?1:0)+(needS?1:0))return null;
 const due=(session.dailyCount||0)>=6||remaining<=(needL?1:0)+(needS?1:0);
 if(!due)return null;
 if(needL&&(!needS||remaining>1))return 'listening';
 if(needS)return 'speaking';
 return null;
}
export function practiceKind(p,canListen=false,canSpeak=false,session=null){
 if(p.recognised<4)return p.practiceAttempts%2?'correct-sentence':'choice';
 if(p.constructed<4)return ['wordbank','gap','form'][p.practiceAttempts%3];
 if(p.weakness>=4)return ['wordbank','gap','typed'][p.practiceAttempts%3];
 const beat=sessionBeatKind(p,canListen,canSpeak,session);
 if(beat)return beat;
 const cycle=['typed','typed','wordbank','typed','correction','form','typed','gap','correct-sentence','choice'];
 return cycle[p.practiceAttempts%cycle.length];
}
export function spreadPracticePool(pool,state,{keepVerb=false}={}){
 if(pool.length<2)return pool;
 const recent=state.exposures.slice(-3);
 const lastSentence=recent.at(-1)?.nl;
 if(lastSentence){
  const differentSentence=pool.filter(item=>normalize(item.nl)!==lastSentence);
  if(differentSentence.length)pool=differentSentence;
 }
 if(!keepVerb){
  const recentVerbs=new Set(recent.slice(-2).map(x=>x.verb).filter(Boolean));
  if(recentVerbs.size){
   const differentVerb=pool.filter(item=>!recentVerbs.has(item.verb));
   if(differentVerb.length)pool=differentVerb;
  }
 }
 return pool;
}
const fallbackKinds=['choice','wordbank','typed','gap','form','correct-sentence','correction'];
const supportsKind=(item,kind)=>!Array.isArray(item.suitableKinds)||item.suitableKinds.includes(kind)||kind==='speaking'&&item.suitableKinds.includes('typed');
export function availableProofCount(state,content,concept){
 const seen=new Set(state.exposures.map(x=>x.nl));
 return eligibleProof(state,content,concept).filter(x=>supportsKind(x,'choice')&&supportsKind(x,'typed')&&!seen.has(normalize(x.nl))).length;
}
function compatiblePractice(pool,all,kind,state){
 const suitable=(rows,k)=>rows.filter(item=>supportsKind(item,k));
 let selected=suitable(pool,kind);
 if(!selected.length)selected=suitable(all,kind);
 if(!selected.length){
  kind=fallbackKinds.find(k=>suitable(all,k).length);
  if(!kind)throw Error('No compatible practice content available');
  selected=suitable(all,kind);
 }
 let eligible=selected.filter(item=>!spellingBlocked(state,item,kind));
 if(!eligible.length){
  const alternative=['wordbank',...fallbackKinds.filter(k=>k!=='wordbank')].find(k=>suitable(all,k).some(item=>!spellingBlocked(state,item,k)));
  if(alternative){kind=alternative;eligible=suitable(all,kind).filter(item=>!spellingBlocked(state,item,kind));}
  else{kind='choice';eligible=suitable(all,kind);}
 }
 if(!eligible.length)throw Error('No compatible practice content available');
 return {pool:eligible,kind};
}
export function selectExtraPractice(state,content,concept,canListen=false,canSpeak=false){
 const all=content.sentences.filter(x=>x.concept===concept&&x.pool==='practice');
 let pool=all;
 pool=spreadPracticePool(pool,state);
 let kind=practiceKind(state.progress[concept]||{},canListen,canSpeak,practiceSession(state,'extra'));
 ({pool,kind}=compatiblePractice(pool,all,kind,state));
 pool=spreadPracticePool(pool,state);
 const item=[...pool].sort((a,b)=>(itemPriority(b,state)+practiceContextWeight(b))-(itemPriority(a,state)+practiceContextWeight(a)))[0];
 if(!item)throw Error('No practice content available');
 return {item,kind,phase:'extra'};
}
export function grammarReviewBudget(state,content,date){
 const retained=content.concepts.filter(c=>state.progress[c.id]?.masteredAt).length;
 if(!retained)return 0;
 const current=content.concepts.find(c=>!state.progress[c.id]?.masteredAt);
 const p=current&&state.progress[current.id];
 const proofDue=p&&(p.status==='proof-ready'||p.retentionDue&&p.retentionDue<=date);
 const reserved=state.proof?.type==='mastery'||proofDue&&p.status==='proof-ready'?20:state.proof?.type==='retention'||proofDue?10:0;
 const proofAnswered=(state.attempts||[]).filter(a=>a.date===date&&['mastery','retention'].includes(a.phase)).length;
 return Math.max(0,Math.min(6,1+Math.floor(retained/4),Math.floor((20-Math.max(reserved,proofAnswered))/2)));
}
export function selectPractice(state,content,current,date,canListen,canSpeak=false){
 const allMastered=content.concepts.every(c=>state.progress[c.id].masteredAt);
 const today=(state.attempts||[]).filter(a=>a.date===date&&a.phase==='maintenance');
 const budget=grammarReviewBudget(state,content,date);
 const reviewed=new Set(today.filter(a=>!a.reviewFollowUp).map(a=>a.concept));
 const maintenance=content.concepts.filter(c=>{const p=state.progress[c.id];return p.masteredAt&&!reviewed.has(c.id)&&(!p.nextMaintenance||p.nextMaintenance<=date);});
 let concept=current;let phase='practice';
 const dueReview=maintenance.length&&today.length<budget&&(allMastered||state.daily.count>=Math.floor((today.length+1)*20/budget)-1);
 if(dueReview){concept=maintenance.sort((a,b)=>{
  const x=state.progress[a.id],y=state.progress[b.id];
  return (x.nextMaintenance||'').localeCompare(y.nextMaintenance||'')
   ||Number(y.status==='reinforcement')-Number(x.status==='reinforcement')
   ||(x.lastIndependentReview||'').localeCompare(y.lastIndependentReview||'')
   ||content.concepts.indexOf(a)-content.concepts.indexOf(b);
 })[0].id;phase='maintenance'}
 const due=state.retries.find(r=>r.after<=state.attempts.length&&(!r.date||r.date<=date));
 const reviewFollowUp=!!due&&!!state.progress[due.concept]?.masteredAt&&due.date===date&&reviewed.has(due.concept)&&!today.some(a=>a.concept===due.concept&&a.reviewFollowUp)&&today.length<budget;
 if(due&&state.progress[due.concept]?.taught&&(!state.progress[due.concept].masteredAt||reviewFollowUp)){
  concept=due.concept;phase=state.progress[concept].masteredAt?'maintenance':'practice';
 }
 const all=content.sentences.filter(x=>x.concept===concept&&x.pool==='practice');
 let pool=all,focusedRetry=false;
 if(due&&due.concept===concept){const focused=pool.filter(x=>x.verb===due.verb&&x.id!==due.sourceId&&!state.exposures.slice(-2).some(e=>e.nl===normalize(x.nl)));if(focused.length){pool=focused;focusedRetry=true;}}
 pool=spreadPracticePool(pool,state,{keepVerb:focusedRetry});
 const session=practiceSession(state,phase);
 let kind=practiceKind(state.progress[concept],canListen,canSpeak,session);
 if(due?.concept===concept&&due.reason==='mastery-recovery'){
  const failures=(state.progress[concept]?.proofHistory||[]).filter(report=>report.type==='mastery'&&!report.passed).length;
  kind=due.direction==='nl-en'?'choice':failures>=2?'wordbank':'typed';
 }
 if(phase==='maintenance')kind=reviewFollowUp&&due?.concept===concept?'wordbank':'typed';
 ({pool,kind}=compatiblePractice(pool,all,kind,state));
 pool=spreadPracticePool(pool,state,{keepVerb:focusedRetry});
 const vocabularyGains=new Map(phase==='practice'?pool.map(item=>[item.id,practiceVocabularyGain(item,state,content,concept)]):[]);
 const item=[...pool].sort((a,b)=>(itemPriority(b,state)+practiceContextWeight(b)+(vocabularyGains.get(b.id)||0))-(itemPriority(a,state)+practiceContextWeight(a)+(vocabularyGains.get(a.id)||0)))[0];
 if(!item)throw Error('No practice content available');
 return {item,kind,phase,retryId:due?.concept===concept?due.id:null,reviewFollowUp:phase==='maintenance'&&reviewFollowUp&&due?.concept===concept};
}
export function selectProof(state,content,concept,count){
 const seen=new Set(state.exposures.map(x=>x.nl));
 const candidates=eligibleProof(state,content,concept).filter(x=>supportsKind(x,'choice')&&supportsKind(x,'typed')&&!seen.has(normalize(x.nl)));
 const picked=[];const temp={...state,exposures:[...state.exposures]};
 while(picked.length<count&&candidates.length){candidates.sort((a,b)=>itemPriority(b,temp)-itemPriority(a,temp));const x=candidates.shift();picked.push(x);temp.exposures.push({nl:normalize(x.nl),verb:x.verb,subject:x.subject,family:x.family,words:x.vocabulary.map(w=>w.id)});}
 if(picked.length!==count)throw Error('Not enough unseen proof sentences remain in this pack. Add a content pack before another test; seen questions will never be recycled as unseen.');
 return picked;
}
