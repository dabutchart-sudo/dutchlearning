import {visualNeedForRecord} from './visual-need.js';

export const VISUAL_SEMANTIC_DECISIONS=Object.freeze({SUITABLE:'suitable',UNSUITABLE:'unsuitable'});

const clean=value=>String(value??'').trim();
const cardId=record=>clean(record?.id);

export function visualSemanticDecision(state={},id){
 const saved=state.visualSemanticReviews?.[String(id)]||null;
 if(!saved)return null;
 const decision=clean(saved.decision).toLowerCase();
 if(!Object.values(VISUAL_SEMANTIC_DECISIONS).includes(decision))return null;
 return {...saved,decision};
}

export function visualSemanticReviewQueue(cards=[],state={},options={}){
 return cards.map(record=>({record,need:visualNeedForRecord(record,state,options),decision:visualSemanticDecision(state,cardId(record))}))
  .filter(item=>item.need.needed&&item.need.suitability?.status==='review'&&!item.decision)
  .sort((a,b)=>b.need.recallMissDays-a.need.recallMissDays||b.need.recallMisses-a.need.recallMisses||cardId(a.record).localeCompare(cardId(b.record),undefined,{numeric:true}));
}

export function recordVisualSemanticDecision(state={},record,decision,{today,reason='semantic-review'}={}){
 const id=cardId(record),chosen=clean(decision).toLowerCase();
 if(!id)throw new Error('Visual semantic review requires a card id.');
 if(!Object.values(VISUAL_SEMANTIC_DECISIONS).includes(chosen))throw new Error('Visual semantic review decision must be suitable or unsuitable.');
 state.visualSemanticReviews??={};
 state.visualSemanticReviews[id]={decision:chosen,date:today||null,reason:clean(reason)||'semantic-review'};
 return state.visualSemanticReviews[id];
}

export function visualGenerationCandidate(record,state={},options={}){
 const need=visualNeedForRecord(record,state,options),decision=visualSemanticDecision(state,cardId(record));
 return Boolean(need.needed&&need.suitability?.status!=='blocked'&&decision?.decision===VISUAL_SEMANTIC_DECISIONS.SUITABLE);
}

export function visualSemanticReviewSummary(cards=[],state={},options={}){
 const pendingRecords=visualSemanticReviewQueue(cards,state,options).map(item=>item.record),suitableRecords=[],unsuitableRecords=[],generationReadyRecords=[];
 for(const record of cards){
  const need=visualNeedForRecord(record,state,options),decision=visualSemanticDecision(state,cardId(record));
  if(!need.needed||!decision)continue;
  if(decision.decision===VISUAL_SEMANTIC_DECISIONS.SUITABLE)suitableRecords.push(record);
  if(decision.decision===VISUAL_SEMANTIC_DECISIONS.UNSUITABLE)unsuitableRecords.push(record);
  if(visualGenerationCandidate(record,state,options))generationReadyRecords.push(record);
 }
 return {pending:pendingRecords.length,suitable:suitableRecords.length,unsuitable:unsuitableRecords.length,generationReady:generationReadyRecords.length,pendingRecords,suitableRecords,unsuitableRecords,generationReadyRecords};
}
