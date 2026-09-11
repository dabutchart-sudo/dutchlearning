import {PRODUCTION_DAILY_LIMIT,PRODUCTION_STAGE,productionAttemptsToday,productionReadiness} from './flashcards.js';

export const INDEPENDENT_DAILY_LIMIT=1;
export const INDEPENDENT_MISS_COOLDOWN_DAYS=3;

function history(state={}){return Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];}
function dayNumber(value){const d=new Date(`${String(value).slice(0,10)}T12:00:00Z`);return Number.isNaN(d.getTime())?null:Math.floor(d.getTime()/86400000);}
export function independentAttemptsToday(state={},today){return history(state).filter(a=>a?.meaningful===true&&a.date===today&&a.stage===PRODUCTION_STAGE.INDEPENDENT).length;}
export function independentMissCoolingDown(state={},cardId,today,{days=INDEPENDENT_MISS_COOLDOWN_DAYS}={}){
 const now=dayNumber(today);if(now===null)return false;
 const lastMiss=history(state).filter(a=>a?.meaningful===true&&a.stage===PRODUCTION_STAGE.INDEPENDENT&&String(a.cardId)===String(cardId)&&a.correct===false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0];
 if(!lastMiss)return false;const missed=dayNumber(lastMiss.date);if(missed===null)return false;const elapsed=now-missed;return elapsed>=0&&elapsed<Math.max(1,Math.trunc(days));
}

export function independentRecallCandidates(cards=[],state={}, {today,limit=INDEPENDENT_DAILY_LIMIT,random=Math.random}={}){
 if(!today)throw new Error('Independent recall requires a study day.');
 const overallRemaining=Math.max(0,PRODUCTION_DAILY_LIMIT-productionAttemptsToday(state,today));
 const independentRemaining=Math.max(0,Math.trunc(limit)-independentAttemptsToday(state,today));
 const remaining=Math.min(overallRemaining,independentRemaining);
 if(!remaining)return[];
 const seenToday=new Set(history(state).filter(a=>a?.meaningful===true&&a.date===today).map(a=>String(a.cardId)));
 return productionReadiness(cards,state).records
  .filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.INDEPENDENT&&!seenToday.has(String(r.id))&&!independentMissCoolingDown(state,r.id,today))
  .sort(()=>random()-.5)
  .slice(0,remaining);
}

export function independentExercise(record){
 if(!record)throw new Error('Independent recall needs a vocabulary record.');
 return {cardId:String(record.id),stage:PRODUCTION_STAGE.INDEPENDENT,kind:'typed',prompt:record.english,answer:record.dutch,meaningful:true};
}
