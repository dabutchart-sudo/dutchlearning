import {validateState} from './persistence.js';

function clone(value){
 return value==null?value:JSON.parse(JSON.stringify(value));
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

export function mapTrainerAttempt(row){
 if(!row||!row.id)return null;
 const date=/^\d{4}-\d{2}-\d{2}$/.test(row.day||'')?row.day:String(row.attempted_at||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
 return {
  id:row.id,
  date,
  occurredAt:row.attempted_at||null,
  concept:row.concept_id||row.concept||null,
  kind:row.exercise_type||row.kind||null,
  direction:row.direction||null,
  phase:row.phase||null,
  sourceId:row.source_id||row.sourceId||null,
  answer:row.answer??'',
  expected:row.correct_answer??row.expected??'',
  grammar:row.grammar_correct==null?null:!!row.grammar_correct,
  spelling:row.spelling_correct==null?null:!!row.spelling_correct,
  assisted:!!row.used_help
 };
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
   const state=validateState(clone(decision.state),content);
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
