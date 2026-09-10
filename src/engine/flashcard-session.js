const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

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
