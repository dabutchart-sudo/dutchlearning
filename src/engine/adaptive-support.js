import {PRODUCTION_STAGE,productionReadiness,spellingRecoveryActive,recallRecoveryActive} from './flashcards.js';

const DAY_MS=86400000;
const dayNumber=value=>{const d=new Date(`${String(value??'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?null:Math.floor(d.getTime()/DAY_MS);};
const blankOutcome=()=>({supportTotal:0,supportCorrect:0,followups:0,followupCorrect:0,supportRate:null,followupRate:null});
const finish=stats=>({...stats,supportRate:stats.supportTotal?stats.supportCorrect/stats.supportTotal:null,followupRate:stats.followups?stats.followupCorrect/stats.followups:null});

export function adaptiveSupportSummary(cards=[],state={},today){
 if(!today)throw new Error('Adaptive support summary requires a study day.');
 const readiness=productionReadiness(cards,state);
 const guided=readiness.records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.GUIDED);
 const spelling=guided.filter(r=>spellingRecoveryActive(state,r.id,today));
 const spellingIds=new Set(spelling.map(r=>r.id));
 const recall=guided.filter(r=>!spellingIds.has(r.id)&&recallRecoveryActive(state,r.id));
 const recoveryIds=new Set([...spelling.map(r=>r.id),...recall.map(r=>r.id)]);
 const nearIndependent=guided.filter(r=>r.evidence.guidedSuccesses===1&&r.evidence.weakness<4&&!recoveryIds.has(r.id));
 return {readiness,spelling,recall,nearIndependent};
}

export function adaptiveSupportOutcomes(state={}, {today,days=30}={}){
 if(!today)throw new Error('Adaptive support outcomes require a study day.');
 const end=dayNumber(today),windowDays=Math.max(1,Math.trunc(Number(days)||30)),start=end-windowDays+1;
 const history=Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];
 const ordered=history.map((attempt,index)=>({attempt,index,day:dayNumber(attempt?.date||attempt?.timestamp)})).filter(x=>x.attempt?.meaningful===true&&x.day!==null).sort((a,b)=>a.day-b.day||String(a.attempt.timestamp||'').localeCompare(String(b.attempt.timestamp||''))||a.index-b.index);
 const overall=blankOutcome(),byType={spelling:blankOutcome(),recall:blankOutcome()};
 for(let i=0;i<ordered.length;i++){
  const current=ordered[i];
  if(current.day<start||current.day>end)continue;
  const type=current.attempt.recovery;
  if(type!=='spelling'&&type!=='recall')continue;
  const buckets=[overall,byType[type]];
  for(const bucket of buckets){bucket.supportTotal++;if(current.attempt.correct===true)bucket.supportCorrect++;}
  const cardId=String(current.attempt.cardId??'');
  const follow=ordered.slice(i+1).find(x=>String(x.attempt.cardId??'')===cardId&&!x.attempt.recovery&&x.attempt.stage===PRODUCTION_STAGE.GUIDED);
  if(!follow)continue;
  for(const bucket of buckets){bucket.followups++;if(follow.attempt.correct===true)bucket.followupCorrect++;}
 }
 return {days:windowDays,overall:finish(overall),byType:{spelling:finish(byType.spelling),recall:finish(byType.recall)}};
}
