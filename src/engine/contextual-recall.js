import {PRODUCTION_DAILY_LIMIT,PRODUCTION_STAGE,productionAttemptsToday,productionReadiness} from './flashcards.js';

export const CONTEXTUAL_DAILY_LIMIT=1;

function history(state={}){return Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];}
function clean(value){return String(value??'').trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');}
function hasUsableSentence(record){
 const dutch=String(record?.example?.dutch??'').trim(),english=String(record?.example?.english??'').trim(),target=clean(record?.dutch);
 if(!dutch||!english||dutch.split(/\s+/).length<3||!target)return false;
 return clean(dutch).includes(target);
}
function shuffled(items,random=Math.random){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
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
  .map(r=>({record:r,tie:random()}))
  .sort((a,b)=>a.tie-b.tie)
  .slice(0,remaining)
  .map(x=>x.record);
}

export function contextualExercise(record,random=Math.random){
 if(!record||!hasUsableSentence(record))throw new Error('Contextual recall needs a card with a usable sentence pair.');
 const answer=String(record.example.dutch).trim(),tiles=shuffled(answer.split(/\s+/).filter(Boolean),random);
 return {cardId:String(record.id),stage:PRODUCTION_STAGE.CONTEXTUAL,kind:'context-tiles',prompt:String(record.example.english).trim(),answer,tiles,target:record.dutch,meaningful:true};
}
