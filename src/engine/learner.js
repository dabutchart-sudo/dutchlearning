import {uid,dayKey,addDays,normalize} from './util.js';
import {selectPractice,selectProof} from './scheduler.js';
import {makeExercise} from './exercises.js';
import {assess} from './scoring.js';
export const DAY_SIZE=20;
export function blankProgress(){return {status:'learning',taught:false,practiceAttempts:0,recognised:0,constructed:0,independent:0,weakness:0,remedial:0,masteredAt:null,retentionDue:null,nextMaintenance:null,proofHistory:[]};}
export function freshState(content,now=new Date()){return {schemaVersion:5,revision:0,learnerId:uid(),deviceId:uid(),createdAt:now.toISOString(),progress:Object.fromEntries(content.concepts.map(c=>[c.id,blankProgress()])),attempts:[],exposures:[],words:{},retries:[],daily:{date:dayKey(now),count:0},pending:null,proof:null,lastProof:null,settings:{listening:false},migration:null};}
export function ensureDay(s,now=new Date()){const date=dayKey(now);if(date>s.daily.date)s.daily={date,count:0};return s.daily;}
export function phase(p,date){if(p.masteredAt&&p.status!=='reinforcement')return 'mastered';if(p.retentionDue)return date>=p.retentionDue?'retention-ready':'retention-wait';return p.status;}
export function unlocked(c,s){return c.prerequisites.every(id=>!!s.progress[id]?.masteredAt);}
export function activeConcept(s,c){return c.concepts.find(x=>unlocked(x,s)&&!s.progress[x.id].masteredAt)?.id||c.concepts.at(-1).id;}
export function teachConcept(s,id,content){const c=content.conceptById[id];if(!unlocked(c,s))throw Error('Finish the previous concept first');s.progress[id].taught=true;const item=content.byId[c.exampleId];if(item)expose(s,item,'teaching');}
export function expose(s,item,reason){if(s.exposures.some(x=>x.nl===normalize(item.nl)))return;s.exposures.push({id:item.id,nl:normalize(item.nl),verb:item.verb,subject:item.subject,family:item.family,words:item.vocabulary.map(w=>w.id),reason});}
export function markWordsTaught(s,item,date){for(const w of item.vocabulary){s.words[w.id]??={weakness:0,attempts:0,spellingErrors:0,recallErrors:0};s.words[w.id].taughtAt=date;}}
export function prepareQuestion(s,c,now=new Date(),canListen=false){
 ensureDay(s,now);if(s.daily.count>=DAY_SIZE)return null;if(s.pending)return s.pending;
 let q,item,retryId;
 if(s.proof){q=s.proof.questions[s.proof.index];item=c.byId[q.sourceId];}
 else{
  const current=activeConcept(s,c);const selected=selectPractice(s,c,current,s.daily.date,canListen);item=selected.item;retryId=selected.retryId;
  if(!s.progress[item.concept].taught)return {teachingConcept:item.concept};
  q=makeExercise(item,selected.kind,c,{phase:selected.phase});
 }
 q.retryId=retryId||null;s.pending=q;expose(s,item,q.phase);
 // Repeated exposures also penalise recent use; the full exposure ledger protects proof novelty.
 s.exposures.push({id:item.id,nl:normalize(item.nl),verb:item.verb,subject:item.subject,family:item.family,words:item.vocabulary.map(w=>w.id),reason:'question',questionId:q.id});
 return q;
}
export function proofEligibility(s,c,id,type,now=new Date()){
 const p=s.progress[id],date=dayKey(now),status=phase(p,date),n=type==='mastery'?20:10;
 const count=date>s.daily.date?0:s.daily.count;
 if(s.proof)return 'Finish the test already in progress.';
 if(s.pending)return 'Finish the current question first.';
 if(type==='mastery'&&status!=='proof-ready'||type==='retention'&&status!=='retention-ready')return 'This test is not ready yet.';
 if(DAY_SIZE-count<n)return `This test needs ${n} of your daily 20 questions. Start it on your next study day.`;
 return null;
}
export function startProof(s,c,id,type,now=new Date()){
 ensureDay(s,now);const reason=proofEligibility(s,c,id,type,now);if(reason)throw Error(reason);
 const n=type==='mastery'?20:10;const items=selectProof(s,c,id,n);
 const questions=items.map((item,i)=>makeExercise(item,i%2===0?'choice':'typed',c,{phase:type,direction:i%2===0?'nl-en':'en-nl'}));
 s.proof={id:uid(),concept:id,type,startedAt:now.toISOString(),index:0,questions,attemptIds:[]};return s.proof;
}
function finishProof(s,now){
 const proof=s.proof,p=s.progress[proof.concept],n=proof.type==='mastery'?10:5;
 const attempts=s.attempts.filter(x=>proof.attemptIds.includes(x.id));
 const directions=Object.fromEntries(['nl-en','en-nl'].map(d=>{const a=attempts.filter(x=>x.direction===d);return [d,{correct:a.filter(x=>x.grammar===true&&!x.assisted).length,total:a.length}]}));
 const passed=Object.values(directions).every(x=>x.total===n&&x.correct===n);
 const report={id:proof.id,type:proof.type,concept:proof.concept,completedAt:now.toISOString(),directions,passed};p.proofHistory.push(report);s.lastProof=report;
 if(passed&&proof.type==='mastery'){p.status='retention-wait';p.retentionDue=addDays(dayKey(now),3);}
 else if(passed){p.status='mastered';p.masteredAt=dayKey(now);p.nextMaintenance=addDays(dayKey(now),7);p.retentionDue=null;p.weakness=0;}
 else{p.status='learning';p.retentionDue=null;p.remedial=8;p.weakness=Math.max(p.weakness,4);}
 s.proof=null;
}
export function submit(s,c,questionId,raw,now=new Date()){
 ensureDay(s,now);if(s.daily.count>=DAY_SIZE)throw Error('Today’s 20 questions are complete.');
 const q=s.pending;if(!q||q.id!==questionId)throw Error('This question has already been answered or changed.');
 if(!String(raw).trim())throw Error('Enter or choose an answer first.');
 const item=c.byId[q.sourceId],p=s.progress[q.concept];
 const knownWords=new Set(c.sentences.flatMap(x=>normalize(x.nl).split(' ')));
 const a=assess(q,raw,{assisted:q.assisted,knownWords});
 const rec={...a,id:uid(),learnerId:s.learnerId,deviceId:s.deviceId,occurredAt:now.toISOString(),date:s.daily.date,questionId:q.id,sourceId:q.sourceId,concept:q.concept,phase:q.phase,kind:q.kind,direction:q.direction,prompt:q.prompt,answer:raw,expected:q.answer,verb:item.verb,words:item.vocabulary.map(w=>w.id)};
 s.attempts.push(rec);s.daily.count++;s.pending=null;
 p.weakness=Math.max(0,Math.min(12,p.weakness+(a.grammar===true?-1:2)));
 if(q.phase==='practice'){
  p.practiceAttempts++;
  if(a.grammar===true){if(['choice','correct-sentence','listening'].includes(q.kind))p.recognised++;if(['wordbank','gap','form'].includes(q.kind))p.constructed++;if(a.independent)p.independent++;if(p.remedial)p.remedial--;}
  if(p.practiceAttempts>=c.conceptById[q.concept].minPractice&&!p.remedial&&!p.retentionDue&&!p.masteredAt)p.status='proof-ready';
 }
 if(q.phase==='maintenance'){
  if(a.grammar!==true){p.status='reinforcement';p.nextMaintenance=dayKey(now);}
  else if(p.weakness<=1){p.status='mastered';p.nextMaintenance=addDays(dayKey(now),7);}
 }
 for(const w of item.vocabulary){
  const v=s.words[w.id]??={weakness:0,attempts:0,spellingErrors:0,recallErrors:0};v.attempts++;v.lastSeen=dayKey(now);v.weakness=Math.max(0,Math.min(10,v.weakness+(a.spelling===false||!a.vocabulary?1:-.5)));if(a.spelling===false)v.spellingErrors++;if(q.assisted||a.errorType==='vocabulary')v.recallErrors++;
 }
 if(q.retryId)s.retries=s.retries.filter(x=>x.id!==q.retryId);
 if(['practice','maintenance'].includes(q.phase)&&(a.grammar!==true||a.spelling===false||q.assisted))s.retries.push({id:uid(),concept:q.concept,verb:item.verb,sourceId:item.id,after:s.attempts.length+2,date:dayKey(now)});
 if(s.proof){s.proof.attemptIds.push(rec.id);s.proof.index++;if(s.proof.index===s.proof.questions.length)finishProof(s,now);}
 s.revision++;return rec;
}
export function useHelp(s){if(!s.pending||!['practice','maintenance'].includes(s.pending.phase))throw Error('Word help is unavailable during proof.');s.pending.assisted=true;}
export function statistics(attempts){const spelled=attempts.filter(x=>x.spelling!==null);return {total:attempts.length,grammar:attempts.filter(x=>x.grammar===true).length,spelling:spelled.filter(x=>x.spelling).length,spellingTotal:spelled.length,independent:attempts.filter(x=>x.independent).length,recall:attempts.filter(x=>x.vocabulary).length};}
