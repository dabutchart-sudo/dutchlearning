const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const day=value=>String(value??'').slice(0,10);
const month=value=>day(value).slice(0,7);

export const VISUAL_GENERATION_DAILY_LIMIT=1;
export const VISUAL_GENERATION_MONTHLY_LIMIT=10;

export function visualGenerationAllowance(events=[],{today,dailyLimit=VISUAL_GENERATION_DAILY_LIMIT,monthlyLimit=VISUAL_GENERATION_MONTHLY_LIMIT}={}){
 const date=day(today);
 if(!date)throw new Error('Visual generation allowance requires a study day.');
 const daily=Math.max(0,Math.trunc(finite(dailyLimit,VISUAL_GENERATION_DAILY_LIMIT)));
 const monthly=Math.max(0,Math.trunc(finite(monthlyLimit,VISUAL_GENERATION_MONTHLY_LIMIT)));
 const attempts=(events||[]).filter(Boolean);
 const usedToday=attempts.filter(e=>day(e.createdAt||e.created_at||e.date)===date).length;
 const usedMonth=attempts.filter(e=>month(e.createdAt||e.created_at||e.date)===month(date)).length;
 const dailyRemaining=Math.max(0,daily-usedToday),monthlyRemaining=Math.max(0,monthly-usedMonth);
 return {allowed:dailyRemaining>0&&monthlyRemaining>0,usedToday,usedMonth,dailyLimit:daily,monthlyLimit:monthly,dailyRemaining,monthlyRemaining,remaining:Math.min(dailyRemaining,monthlyRemaining)};
}
