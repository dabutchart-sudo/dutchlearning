import {PRODUCTION_DAILY_LIMIT,PRODUCTION_STAGE,productionAttemptsToday,productionReadiness} from './flashcards.js';

export const CONTEXTUAL_DAILY_LIMIT=1;
export const CONTEXTUAL_PROOF_SUCCESSES=2;
export const CONTEXTUAL_PROOF_CONTEXTS=2;

function history(state={}){return Array.isArray(state.flashcardProduction?.attempts)?state.flashcardProduction.attempts:[];}
function courseHistory(state={}){return Array.isArray(state.attempts)?state.attempts:[];}
function clean(value){return String(value??'').trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');}
function words(value){return clean(value).split(/\s+/).map(w=>w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'')).filter(Boolean);}
function containsTarget(sentence,target){const hay=words(sentence),needle=words(target);if(!needle.length||needle.length>hay.length)return false;return hay.some((_,i)=>needle.every((word,j)=>hay[i+j]===word));}
function usablePair(record,pair){
 const dutch=String(pair?.nl??pair?.dutch??'').trim(),english=String(pair?.en??pair?.english??'').trim(),target=clean(record?.dutch);
 if(!dutch||!english||dutch.split(/\s+/).length<3||!target)return null;
 if(!containsTarget(dutch,target))return null;
 return {nl:dutch,en:english,id:String(pair?.id||'')||null};
}
function fallbackPair(record){return usablePair(record,{nl:record?.example?.dutch,en:record?.example?.english,id:`card:${record?.id}:current`});}
function hasUsableSentence(record){return Boolean(fallbackPair(record));}
function shuffled(items,random=Math.random){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}
function evidenceDate(attempt){return String(attempt?.date||attempt?.occurredAt||attempt?.timestamp||'').slice(0,10);}
function evidenceTime(attempt){const raw=attempt?.occurredAt||attempt?.timestamp||`${evidenceDate(attempt)}T12:00:00`;const value=Date.parse(raw);return Number.isFinite(value)?value:0;}
function contextKey(attempt){return clean(attempt?.expected||attempt?.correctSentence||'');}
function contextualHistory(state={},cardId){return history(state).filter(a=>a?.meaningful===true&&a.stage===PRODUCTION_STAGE.CONTEXTUAL&&String(a.cardId)===String(cardId)).map(a=>({...a,source:'flashcards'}));}
function courseContextualHistory(state={},cardId){
 const key=`card:${String(cardId)}`;
 return courseHistory(state).filter(a=>Array.isArray(a?.words)&&a.words.includes(key)&&a.direction==='en-nl'&&a.independent===true&&a.grammar===true&&a.spelling!==false&&a.assisted!==true).map(a=>({...a,correct:true,source:'course',date:evidenceDate(a)}));
}

export function contextualEvidenceForCard(state={},cardId,{requiredSuccesses=CONTEXTUAL_PROOF_SUCCESSES,requiredContexts=CONTEXTUAL_PROOF_CONTEXTS}={}){
 const flashcardAttempts=contextualHistory(state,cardId),courseAttempts=courseContextualHistory(state,cardId),attempts=[...flashcardAttempts,...courseAttempts].sort((a,b)=>evidenceTime(a)-evidenceTime(b)),correct=attempts.filter(a=>a.correct===true),correctDays=new Set(correct.map(evidenceDate).filter(Boolean)),correctContexts=new Set(correct.map(contextKey).filter(Boolean)),courseDays=new Set(courseAttempts.map(evidenceDate).filter(Boolean)),flashcardDays=new Set(flashcardAttempts.filter(a=>a.correct===true).map(evidenceDate).filter(Boolean)),latest=attempts.at(-1)||null,successDays=correctDays.size,successContexts=correctContexts.size;
 return {attempts:attempts.length,flashcardAttempts:flashcardAttempts.length,courseAttempts:courseAttempts.length,correct:correct.length,successDays,successContexts,courseSuccessDays:courseDays.size,flashcardSuccessDays:flashcardDays.size,requiredSuccesses,requiredContexts,proven:successDays>=requiredSuccesses&&successContexts>=requiredContexts&&latest?.correct===true,lastResult:latest?.correct===true?'correct':latest?.correct===false?'wrong':null,lastSource:latest?.source||null};
}

export function contextualProofSummary(cards=[],state={}, {requiredSuccesses=CONTEXTUAL_PROOF_SUCCESSES,requiredContexts=CONTEXTUAL_PROOF_CONTEXTS}={}){
 const records=productionReadiness(cards,state).records.filter(r=>r.evidence.productionStage===PRODUCTION_STAGE.CONTEXTUAL&&hasUsableSentence(r));
 const evidence=records.map(record=>({record,evidence:contextualEvidenceForCard(state,record.id,{requiredSuccesses,requiredContexts})}));
 return {eligible:records.length,proven:evidence.filter(x=>x.evidence.proven).length,developing:evidence.filter(x=>!x.evidence.proven&&x.evidence.attempts>0).length,untried:evidence.filter(x=>x.evidence.attempts===0).length,courseContributors:evidence.filter(x=>x.evidence.courseSuccessDays>0).length,records:evidence};
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
  .sort((a,b)=>Number(a.evidence.proven)-Number(b.evidence.proven)||a.evidence.successContexts-b.evidence.successContexts||a.evidence.successDays-b.evidence.successDays||a.evidence.attempts-b.evidence.attempts||a.tie-b.tie)
  .slice(0,remaining)
  .map(x=>x.record);
}

export function contextualExercise(record,random=Math.random,sentencePair=null){
 const pair=usablePair(record,sentencePair)||fallbackPair(record);
 if(!record||!pair)throw new Error('Contextual recall needs a usable sentence pair containing the target word.');
 const answer=pair.nl,tiles=shuffled(answer.split(/\s+/).filter(Boolean),random);
 return {cardId:String(record.id),stage:PRODUCTION_STAGE.CONTEXTUAL,kind:'context-tiles',prompt:pair.en,answer,tiles,target:record.dutch,contextId:pair.id,meaningful:true};
}
