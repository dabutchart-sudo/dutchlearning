import {PRODUCTION_DAILY_LIMIT,PRODUCTION_STAGE,productionAttemptsToday,productionReadiness} from './flashcards.js';

export const INDEPENDENT_DAILY_LIMIT=1;
export const INDEPENDENT_MISS_COOLDOWN_DAYS=3;
export const INDEPENDENT_SPELLING_COOLDOWN_DAYS=1;

function history(state={}){return Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];}
function dateValue(day){const t=Date.parse(`${day}T12:00:00`);return Number.isFinite(t)?t:null;}
function daysBetween(a,b){const x=dateValue(a),y=dateValue(b);return x===null||y===null?Infinity:Math.round((y-x)/86400000);}
function lastIndependentMiss(state,cardId){return history(state).filter(a=>a?.meaningful===true&&String(a.cardId)===String(cardId)&&a.stage===PRODUCTION_STAGE.INDEPENDENT&&a.correct===false).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))[0]||null;}
export function independentMissCooldownDays(attempt){return attempt?.errorType==='spelling'?INDEPENDENT_SPELLING_COOLDOWN_DAYS:INDEPENDENT_MISS_COOLDOWN_DAYS;}
export function independentMissCoolingDown(state={},cardId,today){const miss=lastIndependentMiss(state,cardId);if(!miss?.date)return false;const elapsed=daysBetween(miss.date,today),cooldown=independentMissCooldownDays(miss);return elapsed>=0&&elapsed<cooldown;}
export function independentAttemptsToday(state={},today){return history(state).filter(a=>a?.meaningful===true&&a.date===today&&a.stage===PRODUCTION_STAGE.INDEPENDENT).length;}

export function independentReadinessSummary(cards=[],state={}){
 const records=productionReadiness(cards,state).records;
 const ready=records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.INDEPENDENT);
 const contextual=records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.CONTEXTUAL);
 const guided=records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.GUIDED);
 const near=guided.filter(r=>r.srs.interval>=21&&r.evidence.weakness<4).map(r=>({id:r.id,dutch:r.dutch,english:r.english,guidedSuccesses:r.evidence.guidedSuccesses,needed:Math.max(0,2-r.evidence.guidedSuccesses)})).filter(r=>r.needed>0).sort((a,b)=>a.needed-b.needed||a.dutch.localeCompare(b.dutch,'nl')).slice(0,3);
 return {ready:ready.length,contextual:contextual.length,guided:guided.length,near};
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
