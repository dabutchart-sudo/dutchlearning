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

export function visualGenerationReadiness(status={}){
 const reason=clean(status.reason)||'unknown';
 if(status.ready)return {state:'ready',message:'Visual generation is ready.',nextAction:'Generate only after the learner confirms the spending action.'};
 const map={
  disabled:{state:'setup',message:'The server feature flag is off.',nextAction:'Keep VISUAL_GENERATION_ENABLED=false until migrations, Storage, Edge Function and budget secrets are deployed; enable it last.'},
  'missing-openai-key':{state:'setup',message:'The server is missing its OpenAI image-generation key.',nextAction:'Add OPENAI_API_KEY as a Supabase Edge Function secret; never put it in GitHub or browser code.'},
  'usage-budget-disabled':{state:'setup',message:'Server count limits currently disable image spending.',nextAction:'Set positive daily and monthly generation limits before enabling the feature.'},
  'cost-budget-unconfigured':{state:'setup',message:'The estimated per-image cost or monthly GBP ceiling is not configured.',nextAction:'Set both VISUAL_GENERATION_ESTIMATED_COST_GBP and VISUAL_GENERATION_MONTHLY_BUDGET_GBP to positive conservative values.'},
  'audit-log-unavailable':{state:'setup',message:'The private visual-generation audit schema is not available.',nextAction:'Run all visual-generation database migrations, including the atomic budget reservation migration, before enabling generation.'},
  'storage-bucket-unavailable':{state:'setup',message:'The visual-cue Storage bucket is unavailable.',nextAction:'Create the configured Supabase Storage bucket (visual-cues by default) before enabling generation.'},
  'storage-bucket-not-public':{state:'setup',message:'The visual-cue Storage bucket is not public.',nextAction:'Make the generated-cue bucket public so approved HTTPS image URLs can be reused and cached offline.'},
  'daily-limit-reached':{state:'limit',message:'Today’s generation allowance has been used.',nextAction:'No deployment change is needed; wait for the next UTC day.'},
  'monthly-limit-reached':{state:'limit',message:'This month’s generation-count allowance has been used.',nextAction:'No deployment change is needed; wait for the next UTC month or deliberately revise the configured limit.'},
  'monthly-cost-ceiling-reached':{state:'limit',message:'The configured monthly GBP ceiling has been reached.',nextAction:'Do not generate more images this month unless you deliberately revise the budget.'}
 };
 return map[reason]||{state:'setup',message:'The visual-generation preflight is not ready.',nextAction:'Check the Edge Function deployment and server preflight response before allowing any spend.'};
}

export function visualGenerationStatusSummary(status={}){
 if(!status.ready){const readiness=visualGenerationReadiness(status);return `${readiness.message} Next: ${readiness.nextAction}`;}
 return `${status.dailyRemaining} daily · ${status.monthlyRemaining} monthly · £${money(status.costRemainingGbp).toFixed(2)} budget remaining`;
}
