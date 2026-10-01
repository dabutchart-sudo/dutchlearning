import {labels,tips} from './scoring.js';

export function recoveryTargets(misses,limit=3){
 const seen=new Set();
 return misses.filter(attempt=>{
  const key=`${attempt.direction}:${attempt.errorType||'translation'}`;
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).slice(0,limit);
}

export function masteryRecovery(state,content,report=state.lastProof){
 if(report?.type!=='mastery'||report.passed)return null;
 const date=report.studyDate||report.completedAt?.slice(0,10);
 const proofAttempts=(state.attempts||[]).filter(attempt=>attempt.phase==='mastery'&&attempt.concept===report.concept&&attempt.date===date&&(!report.completedAt||!attempt.occurredAt||attempt.occurredAt<=report.completedAt)).slice(-20);
 const misses=proofAttempts.filter(attempt=>attempt.grammar!==true||attempt.assisted);
 const groups=new Map();
 for(const attempt of misses){
  const errorType=attempt.errorType||'translation',key=`${attempt.direction}:${errorType}`;
  const existing=groups.get(key);
  if(existing){existing.count++;continue;}
  const item=content.byId[attempt.sourceId];
  groups.set(key,{
   direction:attempt.direction,errorType,label:labels[errorType]||'Sentence pattern',count:1,
   sentence:attempt.correctSentence||item?.nl||'',meaning:attempt.englishMeaning||item?.en||'',
   tip:tips[errorType]||'Compare the full Dutch sentence with its meaning before the next attempt.'
  });
 }
 const failures=(state.progress[report.concept]?.proofHistory||[]).filter(entry=>entry.type==='mastery'&&!entry.passed).length;
 return {failures,misses:misses.length,groups:[...groups.values()]};
}
