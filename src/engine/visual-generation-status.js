const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clean=value=>String(value??'').trim();
const money=value=>Math.max(0,Math.round(finite(value)*100)/100);
const count=value=>Math.max(0,Math.trunc(finite(value)));

export function normalizeVisualGenerationStatus(payload={}){
 if(!payload||typeof payload!=='object')throw new Error('Visual generation status response is invalid.');
 const enabled=payload.enabled===true,ready=payload.ready===true;
 const dailyLimit=count(payload.dailyLimit??payload.daily_limit),monthlyLimit=count(payload.monthlyLimit??payload.monthly_limit);
 const usedToday=count(payload.usedToday??payload.used_today),usedMonth=count(payload.usedMonth??payload.used_month);
 const estimatedCostGbp=money(payload.estimatedCostGbp??payload.estimated_cost_gbp);
 const monthlyBudgetGbp=money(payload.monthlyBudgetGbp??payload.monthly_budget_gbp);
 const usedCostGbp=money(payload.usedCostGbp??payload.used_cost_gbp);
 const dailyRemaining=Math.max(0,count(payload.dailyRemaining??payload.daily_remaining??dailyLimit-usedToday));
 const monthlyRemaining=Math.max(0,count(payload.monthlyRemaining??payload.monthly_remaining??monthlyLimit-usedMonth));
 const costRemainingGbp=money(payload.costRemainingGbp??payload.cost_remaining_gbp??monthlyBudgetGbp-usedCostGbp);
 return {
  enabled,ready,reason:clean(payload.reason)||'unknown',model:clean(payload.model),bucket:clean(payload.bucket),
  dailyLimit,monthlyLimit,usedToday,usedMonth,dailyRemaining,monthlyRemaining,
  estimatedCostGbp,monthlyBudgetGbp,usedCostGbp,costRemainingGbp
 };
}

export function visualGenerationStatusSummary(status={}){
 if(!status.ready)return status.enabled?'Service configuration is incomplete.':'Visual generation is currently disabled.';
 return `${status.dailyRemaining} daily · ${status.monthlyRemaining} monthly · £${money(status.costRemainingGbp).toFixed(2)} budget remaining`;
}
