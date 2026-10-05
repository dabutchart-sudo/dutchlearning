// Owner decision 2026-10-05: speaking transcription may spend at most £5 in a month.
// Each attempt reserves 2p before OpenAI is called. That reserve is far above the
// published gpt-4o-mini-transcribe list price of about $0.003 per minute, checked
// the same day, so a short practice recording cannot use the real £5 by itself.
export const SPEAKING_MONTHLY_BUDGET_GBP=5;
export const SPEAKING_ATTEMPT_COST_GBP=0.02;
export const SPEAKING_MONTHLY_BUDGET_PENCE=500;
export const SPEAKING_ATTEMPT_COST_PENCE=2;
export const SPEAKING_MAX_AUDIO_BYTES=600000;
export const SPEAKING_MAX_RECORDING_MS=15000;

export function speakingBudgetDecision({usedPence=0,audioBytes=1,enabled=false,configuredCeilingPence=SPEAKING_MONTHLY_BUDGET_PENCE}={}){
 const used=Math.max(0,Math.trunc(Number(usedPence)||0));
 const ceiling=Math.trunc(Number(configuredCeilingPence));
 const bytes=Number(audioBytes);
 if(!enabled)return Object.freeze({allowed:false,reason:'disabled',usedPence:used,remainingPence:0,reservePence:SPEAKING_ATTEMPT_COST_PENCE});
 if(!Number.isInteger(ceiling)||ceiling<=0||ceiling>SPEAKING_MONTHLY_BUDGET_PENCE)return Object.freeze({allowed:false,reason:'cost-budget-unconfigured',usedPence:used,remainingPence:0,reservePence:SPEAKING_ATTEMPT_COST_PENCE});
 if(!Number.isFinite(bytes)||bytes<1||bytes>SPEAKING_MAX_AUDIO_BYTES)return Object.freeze({allowed:false,reason:'audio-too-large',usedPence:used,remainingPence:Math.max(0,ceiling-used),reservePence:SPEAKING_ATTEMPT_COST_PENCE});
 if(used+SPEAKING_ATTEMPT_COST_PENCE>ceiling)return Object.freeze({allowed:false,reason:'monthly-cost-ceiling-reached',usedPence:used,remainingPence:Math.max(0,ceiling-used),reservePence:SPEAKING_ATTEMPT_COST_PENCE});
 const next=used+SPEAKING_ATTEMPT_COST_PENCE;
 return Object.freeze({allowed:true,reason:'reserved',usedPence:next,remainingPence:ceiling-next,reservePence:SPEAKING_ATTEMPT_COST_PENCE});
}
