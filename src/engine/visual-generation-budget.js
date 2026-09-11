const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const day=value=>String(value??'').slice(0,10);
const month=value=>day(value).slice(0,7);

export const VISUAL_GENERATION_DAILY_LIMIT=1;
export const VISUAL_GENERATION_MONTHLY_LIMIT=10;

export function visualGenerationAllowance(events=[],{today,dailyLimit=VISUAL_GENERATION_DAILY_LIMIT,monthlyLimit=VISUAL_GENERATION_MONTHLY_LIMIT,estimatedCostGbp=null,monthlyBudgetGbp=null}={}){
 const date=day(today);
 if(!date)throw new Error('Visual generation allowance requires a study day.');
 const daily=Math.max(0,Math.trunc(finite(dailyLimit,VISUAL_GENERATION_DAILY_LIMIT)));
 const monthly=Math.max(0,Math.trunc(finite(monthlyLimit,VISUAL_GENERATION_MONTHLY_LIMIT)));
 const attempts=(events||[]).filter(Boolean);
 const usedToday=attempts.filter(e=>day(e.createdAt||e.created_at||e.date)===date).length;
 const monthAttempts=attempts.filter(e=>month(e.createdAt||e.created_at||e.date)===month(date));
 const usedMonth=monthAttempts.length;
 const dailyRemaining=Math.max(0,daily-usedToday),monthlyRemaining=Math.max(0,monthly-usedMonth);
 const hasCostBudget=estimatedCostGbp!==null||monthlyBudgetGbp!==null;
 const estimate=Math.max(0,finite(estimatedCostGbp));
 const budget=Math.max(0,finite(monthlyBudgetGbp));
 const usedCostGbp=monthAttempts.reduce((sum,e)=>sum+Math.max(0,finite(e.estimatedCostGbp??e.estimated_cost_gbp)),0);
 const costRemainingGbp=Math.max(0,budget-usedCostGbp);
 const costAllowed=!hasCostBudget||(estimate>0&&budget>0&&usedCostGbp+estimate<=budget);
 return {allowed:dailyRemaining>0&&monthlyRemaining>0&&costAllowed,usedToday,usedMonth,dailyLimit:daily,monthlyLimit:monthly,dailyRemaining,monthlyRemaining,remaining:Math.min(dailyRemaining,monthlyRemaining),hasCostBudget,estimatedCostGbp:estimate,monthlyBudgetGbp:budget,usedCostGbp,costRemainingGbp,costAllowed};
}
