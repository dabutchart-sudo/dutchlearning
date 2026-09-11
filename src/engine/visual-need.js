import {classifyProductionError} from './production-errors.js';
import {visualCueForRecord} from './visual-support.js';

const DAY_MS=86400000;
const dayNumber=value=>{const raw=String(value??'').slice(0,10);if(!raw)return null;const d=new Date(`${raw}T12:00:00Z`);return Number.isNaN(d.getTime())?null:Math.floor(d.getTime()/DAY_MS);};
const attemptTime=attempt=>{const direct=Date.parse(attempt?.timestamp||'');if(Number.isFinite(direct))return direct;const fallback=Date.parse(`${String(attempt?.date||'').slice(0,10)}T12:00:00Z`);return Number.isFinite(fallback)?fallback:0;};
const errorType=attempt=>['spelling','recall'].includes(attempt?.errorType)?attempt.errorType:classifyProductionError(attempt?.expected||'',attempt?.answer||'');
const history=state=>Array.isArray(state?.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];

export const VISUAL_NEED_WINDOW_DAYS=21;
export const VISUAL_NEED_RECALL_DAYS=2;

export function visualNeedForRecord(record={},state={}, {today,days=VISUAL_NEED_WINDOW_DAYS,minRecallDays=VISUAL_NEED_RECALL_DAYS}={}){
 if(!today)throw new Error('Visual support need requires a study day.');
 if(visualCueForRecord(record))return {needed:false,reason:'image-available',recallMisses:0,recallMissDays:0,latestError:null,requiresSuitabilityCheck:false};
 const end=dayNumber(today),start=end-Math.max(1,Math.trunc(days))+1,id=String(record.id??'');
 const attempts=history(state).filter(a=>a?.meaningful===true&&String(a.cardId??'')===id).filter(a=>{const day=dayNumber(a.date||a.timestamp);return day!==null&&day>=start&&day<=end;}).sort((a,b)=>attemptTime(a)-attemptTime(b));
 const misses=attempts.filter(a=>a.correct===false&&errorType(a)==='recall'),missDays=new Set(misses.map(a=>String(a.date||a.timestamp||'').slice(0,10)).filter(Boolean)),latest=attempts.at(-1)||null,latestError=latest?.correct===false?errorType(latest):null;
 const needed=missDays.size>=Math.max(1,Math.trunc(minRecallDays))&&latest?.correct===false&&latestError==='recall';
 return {needed,reason:needed?'repeated-recall':latest?.correct===true?'recovered':missDays.size?'not-enough-days':'no-recall-evidence',recallMisses:misses.length,recallMissDays:missDays.size,latestError,requiresSuitabilityCheck:needed};
}

export function visualNeedSummary(cards=[],state={}, {today,days=VISUAL_NEED_WINDOW_DAYS,minRecallDays=VISUAL_NEED_RECALL_DAYS}={}){
 const records=cards.map(record=>({record,need:visualNeedForRecord(record,state,{today,days,minRecallDays})})),candidates=records.filter(x=>x.need.needed);
 return {withImages:records.filter(x=>visualCueForRecord(x.record)).length,candidates:candidates.length,candidateRecords:candidates,days,minRecallDays};
}
