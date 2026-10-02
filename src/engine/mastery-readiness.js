import {addDays,dayKey} from './util.js';

const validDay=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const date=new Date(value+'T12:00:00');
 return Number.isFinite(date.getTime())&&dayKey(date)===value;
};
const attemptDay=attempt=>validDay(attempt?.date)?attempt.date:null;

export function firstMasteryReadiness(state,concept,now=new Date()){
 if(state.progress?.[concept]?.proofHistory?.some(report=>report.type==='mastery'))return {ready:true,priorMastery:true};
 const today=dayKey(now),start=addDays(today,-13),seen=new Set(),eligible=[];
 let incomplete=0;
 for(const [index,attempt] of (state.attempts||[]).entries()){
  if(!attempt||attempt.concept!==concept||attempt.phase!=='practice'||attempt.kind!=='typed'||attempt.direction!=='en-nl')continue;
  if(attempt.id){if(seen.has(attempt.id))continue;seen.add(attempt.id);}
  const date=attemptDay(attempt);
  if(!attempt.id||attempt.assisted!==false||typeof attempt.grammar!=='boolean'||!date){incomplete++;continue;}
  if(date<start||date>today)continue;
  eligible.push({...attempt,date,index});
 }
 eligible.sort((a,b)=>a.date.localeCompare(b.date)||String(a.occurredAt||'').localeCompare(String(b.occurredAt||''))||a.index-b.index);
 const selected=eligible.slice(-12),correct=selected.filter(attempt=>attempt.grammar===true).length;
 const byDay=new Map();for(const attempt of selected)byDay.set(attempt.date,(byDay.get(attempt.date)||0)+1);
 const studyDays=byDay.size,days=[...byDay.values()].filter(count=>count>=2).length;
 const ready=selected.length>=10&&days>=2&&correct/selected.length>=.8;
 return {ready,priorMastery:false,selected:selected.length,correct,days,studyDays,incomplete,start,today};
}

export function firstMasteryReadinessNeed(state,concept,now=new Date()){
 const evidence=firstMasteryReadiness(state,concept,now);
 if(evidence.ready)return null;
 if(evidence.selected<10){
  const detail=evidence.incomplete&&evidence.selected===0?'Older answers do not show enough detail to verify independent writing. ':'';
  return `${detail}Keep practising writing Dutch without hints. ${evidence.selected} of 10 recent typed answers are recorded across ${evidence.studyDays} study ${evidence.studyDays===1?'day':'days'}.`;
 }
 if(evidence.days<2)return 'Practise independent writing on another study day before the first mastery test. At least two typed answers are needed on each of two days.';
 return `Your recent independent writing is ${evidence.correct} of ${evidence.selected}. Reach 80% grammar accuracy before the first mastery test.`;
}
