import {freshState} from './learner.js';
import {validateState} from './persistence.js';

function clone(value){
 return value==null?value:JSON.parse(JSON.stringify(value));
}

function studyDay(row){
 for(const value of [row?.day,row?.date,row?.attempted_at,row?.occurredAt]){
  const text=String(value||'');
  const day=/^\d{4}-\d{2}-\d{2}$/.test(text)?text:text.slice(0,10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(day))return day;
 }
 return null;
}

function flag(row,tableKey,localKey){
 return Object.prototype.hasOwnProperty.call(row,tableKey)?row[tableKey]:row[localKey];
}

export function isPopulatedLearningState(state){
 if(!state||typeof state!=='object')return false;
 if(Array.isArray(state.attempts)&&state.attempts.length>0)return true;
 const progress=state.progress;
 if(!progress||typeof progress!=='object')return false;
 return Object.values(progress).some(p=>p&&((Number(p.practiceAttempts)||0)>0||p.masteredAt));
}

export function decideLearningSync({user,local,remote}={}){
 if(!user)return {type:'none',reason:'signed-out'};
 const remoteState=remote?.state??null;
 const hasRemoteRow=!!remote;
 const localPopulated=isPopulatedLearningState(local);
 const remotePopulated=isPopulatedLearningState(remoteState);
 if(remotePopulated&&!localPopulated)return {type:'download',state:remoteState};
 if(!hasRemoteRow){
  if(!localPopulated)return {type:'none',reason:'empty-local-no-remote'};
  return {type:'upload',state:local};
 }
 if(localPopulated&&!remotePopulated)return {type:'upload',state:local};
 if(!localPopulated&&!remotePopulated)return {type:'none',reason:'both-empty'};
 const lr=Number(local.revision||0),rr=Number(remoteState.revision||-1);
 if(rr>lr)return {type:'download',state:remoteState};
 if(lr>rr)return {type:'upload',state:local};
 return {type:'push-attempts',state:local};
}

export function prepareRemoteLearningState(state,content){
 if(!state||typeof state!=='object')return null;
 const next=clone(state);
 if(next.pending&&(!content?.byId||!content.byId[next.pending.sourceId]))next.pending=null;
 if(next.proof){
  const questions=next.proof.questions;
  if(!Array.isArray(questions)||questions.some(q=>!content?.byId||!content.byId[q.sourceId]))next.proof=null;
 }
 return next;
}

export function mapTrainerAttempt(row){
 if(!row||!row.id)return null;
 const date=studyDay(row);
 if(!date)return null;
 const grammar=flag(row,'grammar_correct','grammar');
 const spelling=flag(row,'spelling_correct','spelling');
 return {
  id:row.id,
  date,
  occurredAt:row.attempted_at||row.occurredAt||null,
  concept:row.concept_id||row.concept||null,
  kind:row.exercise_type||row.kind||null,
  direction:row.direction||null,
  phase:row.phase||null,
  sourceId:row.source_id||row.sourceId||null,
  answer:row.answer??'',
  expected:row.correct_answer??row.expected??'',
  grammar:grammar==null?null:!!grammar,
  spelling:spelling==null?null:!!spelling,
  assisted:!!(Object.prototype.hasOwnProperty.call(row,'used_help')?row.used_help:row.assisted)
 };
}

export function attemptMergeBase(local,content){
 if(local&&typeof local==='object'&&local.schemaVersion===5&&Array.isArray(local.attempts))return local;
 if(!content)return null;
 try{return validateState(clone(freshState(content)),content);}catch{return null;}
}

export function mergeRemoteAttempts(local,rows=[]){
 if(!local||typeof local!=='object'||local.schemaVersion!==5)return {state:local,added:0};
 const base=local;
 const attempts=[...(Array.isArray(base.attempts)?base.attempts:[])];
 const seen=new Set(attempts.map(a=>a&&a.id).filter(Boolean));
 let added=0;
 for(const row of rows){
  const attempt=mapTrainerAttempt(row);
  if(!attempt||seen.has(attempt.id))continue;
  attempts.push(attempt);
  seen.add(attempt.id);
  added++;
 }
 return {state:{...base,attempts},added};
}

export function applyLearningSync({user,local,remote,content}={}){
 const decision=decideLearningSync({user,local,remote});
 if(decision.type==='download'){
  if(!content)return {action:'none',reason:'content-unavailable',writeLocal:false,writeRemote:false,pushAttempts:false};
  try{
   const prepared=prepareRemoteLearningState(decision.state,content);
   const state=validateState(prepared,content);
   return {action:'download',state,reason:null,writeLocal:true,writeRemote:false,pushAttempts:false};
  }catch{
   return {action:'none',reason:'invalid-remote',writeLocal:false,writeRemote:false,pushAttempts:false};
  }
 }
 if(decision.type==='upload'){
  return {action:'upload',state:decision.state,reason:null,writeLocal:false,writeRemote:true,pushAttempts:true};
 }
 if(decision.type==='push-attempts'){
  return {action:'push-attempts',state:decision.state,reason:null,writeLocal:false,writeRemote:false,pushAttempts:true};
 }
 return {action:'none',reason:decision.reason,writeLocal:false,writeRemote:false,pushAttempts:false};
}
