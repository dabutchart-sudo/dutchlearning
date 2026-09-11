import {PRODUCTION_STAGE,productionReadiness,spellingRecoveryActive,recallRecoveryActive} from './flashcards.js';

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
