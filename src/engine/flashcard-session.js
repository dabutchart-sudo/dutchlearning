const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export function reviewLoadAtStart({cards=[],history=[],today}={}){
 if(!today)return 0;
 const ids=new Set();
 for(const card of cards){
  if(card?.suspended||card?.type==='new'||!card?.due_date||String(card.due_date).slice(0,10)>today)continue;
  if(card.id!==undefined&&card.id!==null)ids.add(String(card.id));
 }
 for(const row of history){
  if(!row?.timestamp||String(row.timestamp).slice(0,10)!==today||String(row.review_type??'').toLowerCase()==='new')continue;
  const id=row.cardid??row.card_id;
  if(id!==undefined&&id!==null)ids.add(String(id));
 }
 return ids.size;
}

export function reviewLoadAllowance(raw,due,target){
 const ceiling=Math.max(0,Math.trunc(finite(raw)));
 const goal=Math.max(0,finite(target));
 if(!goal)return ceiling;
 const ratio=Math.max(0,finite(due))/goal;
 if(ratio>=1)return 0;
 if(ratio>=.9)return Math.min(ceiling,Math.max(1,Math.floor(ceiling*.2)));
 if(ratio>=.7)return Math.min(ceiling,Math.max(1,Math.ceil(ceiling*.5)));
 return ceiling;
}

/**
 * Infer that a study day was completed in another client when there are no due
 * reviews left and the shared evidence shows the user reached a sensible end point.
 *
 * This is intentionally conservative. It never infers completion from "0 due"
 * alone: there must be review activity today, plus either the configured new-card
 * allowance has been satisfied or the completed workload reached the review target.
 */
export function inferExternalStudyDayComplete({
 dueReview=0,
 todayReviews=0,
 introducedToday=0,
 configuredMax=5,
 effectiveNewCap=null,
 reviewTarget=60
}={}){
 const due=Math.max(0,Math.trunc(finite(dueReview)));
 const done=Math.max(0,Math.trunc(finite(todayReviews)));
 const introduced=Math.max(0,Math.trunc(finite(introducedToday)));
 const configured=Math.max(0,Math.trunc(finite(configuredMax,5)));
 const effective=effectiveNewCap===null||effectiveNewCap===undefined?configured:Math.min(configured,Math.max(0,Math.trunc(finite(effectiveNewCap))));
 const target=Math.max(0,Math.trunc(finite(reviewTarget,60)));
 if(due>0||done===0)return false;
 const newAllowanceSatisfied=introduced>=effective;
 const substantialReviewDay=target>0&&done>=target;
 return newAllowanceSatisfied||substantialReviewDay;
}
