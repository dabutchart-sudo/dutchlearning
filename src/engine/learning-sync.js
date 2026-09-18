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
