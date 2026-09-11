import {PRODUCTION_DAILY_LIMIT,PRODUCTION_STAGE,productionAttemptsToday,productionReadiness} from './flashcards.js';

export const CONTEXTUAL_DAILY_LIMIT=1;
export const CONTEXTUAL_PROOF_SUCCESSES=2;

function history(state={}){return Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];}
function clean(value){return String(value??'').trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');}
function words(value){return clean(value).split(/\s+/).map(w=>w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'')).filter(Boolean);}
function containsTarget(sentence,target){const hay=words(sentence),needle=words(target);if(!needle.length||needle.length>hay.length)return false;return hay.some((_,i)=>needle.every((word,j)=>hay[i+j]===word));}
function hasUsableSentence(record){
 const dutch=String(record?.example?.dutch??'').trim(),english=String(record?.example?.english??'').trim(),target=clean(record?.dutch);
 if(!dutch||!english||dutch.split(/\s+/).length<3||!target)return false;
 return containsTarget(dutch,target);
}
function shuffled(items,random=Math.random){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
function contextualHistory(state={},cardId){return history(state).filter(a=>a?.meaningful===true&&a.stage===PRODUCTION_STAGE.CONTEXTUAL&&String(a.cardId)===String(cardId));}

export function contextualEvidenceForCard(state={},cardId,{requiredSuccesses=CONTEXTUAL_PROOF_SUCCESSES}={}){
 const attempts=contextualHistory(state,cardId),correct=attempts.filter(a=>a.correct===true),correctDays=new Set(correct.map(a=>String(a.date||a.timestamp||'').slice(0,10)).filter(Boolean)),latest=attempts.at(-1)||null,successDays=correctDays.size;
 return {attempts:attempts.length,correct:correct.length,successDays,requiredSuccesses,proven:successDays>=requiredSuccesses&&latest?.correct===true,lastResult:latest?.correct===true?'correct':latest?.correct===false?'wrong':null};
}

export function contextualProofSummary(cards=[],state={}, {requiredSuccesses=CONTEXTUAL_PROOF_SUCCESSES}={}){
 const records=productionReadiness(cards,state).records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.CONTEXTUAL&&hasUsableSentence(r));
 const evidence=records.map(record=>({record,evidence:contextualEvidenceForCard(state,record.id,{requiredSuccesses})}));
 return {eligible:records.length,proven:evidence.filter(x=>x.evidence.proven).length,developing:evidence.filter(x=>!x.evidence.proven&&x.evidence.attempts>0).length,untried:evidence.filter(x=>x.evidence.attempts===0).length,records:evidence};
}

export function contextualAttemptsToday(state={},today){return history(state).filter(a=>a?.meaningful===true&&a.date===today&&a.stage===PRODUCTION_STAGE.CONTEXTUAL).length;}

export function contextualRecallCandidates(cards=[],state={}, {today,limit=CONTEXTUAL_DAILY_LIMIT,random=Math.random}={}){
 if(!today)throw new Error('Contextual recall requires a study day.');
 const overallRemaining=Math.max(0,PRODUCTION_DAILY_LIMIT-productionAttemptsToday(state,today));
 const contextualRemaining=Math.max(0,Math.trunc(limit)-contextualAttemptsToday(state,today));
 const remaining=Math.min(overallRemaining,contextualRemaining);
 if(!remaining)return[];
 const seenToday=new Set(history(state).filter(a=>a?.meaningful===true&&a.date===today).map(a=>String(a.cardId)));
 return productionReadiness(cards,state).records
  .filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.CONTEXTUAL&&!seenToday.has(String(r.id))&&hasUsableSentence(r))
  .map(r=>({record:r,evidence:contextualEvidenceForCard(state,r.id),tie:random()}))
  .sort((a,b)=>Number(a.evidence.proven)-Number(b.evidence.proven)||a.evidence.successDays-b.evidence.successDays||a.evidence.attempts-b.evidence.attempts||a.tie-b.tie)
  .slice(0,remaining)
  .map(x=>x.record);
}

export function contextualExercise(record,random=Math.random){
 if(!record||!hasUsableSentence(record))throw new Error('Contextual recall needs a card with a usable sentence pair.');
 const answer=String(record.example.dutch).trim(),tiles=shuffled(answer.split(/\s+/).filter(Boolean),random);
 return {cardId:String(record.id),stage:PRODUCTION_STAGE.CONTEXTUAL,kind:'context-tiles',prompt:String(record.example.english).trim(),answer,tiles,target:record.dutch,meaningful:true};
}
