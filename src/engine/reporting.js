const dayKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parseDate=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?null:d;};
export const REPORT_RANGES=[{value:'7',label:'7 days'},{value:'30',label:'30 days'},{value:'90',label:'90 days'},{value:'all',label:'All'}];
export function filterHistory(history,range='30',now=new Date()){
 if(range==='all')return history.filter(x=>parseDate(x.timestamp));
 const days=Math.max(1,parseInt(range,10)||30),cutoff=new Date(now);cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-(days-1));
 return history.filter(x=>{const d=parseDate(x.timestamp);return d&&d>=cutoff;});
}
export function dailyActivity(history,range='30',now=new Date()){
 const filtered=filterHistory(history,range,now),map=new Map();
 for(const h of filtered){const d=parseDate(h.timestamp);if(!d)continue;const key=dayKey(d),row=map.get(key)||{date:key,new:0,reviewed:0,total:0};if(String(h.review_type).toLowerCase()==='new')row.new++;else row.reviewed++;row.total++;map.set(key,row);}
 return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function dailyRetention(history,range='30',now=new Date()){
 const map=new Map();
 for(const h of filterHistory(history,range,now)){if(String(h.review_type).toLowerCase()==='new')continue;const d=parseDate(h.timestamp);if(!d)continue;const key=dayKey(d),row=map.get(key)||{date:key,correct:0,total:0,rate:null};row.total++;if(String(h.rating).toLowerCase()!=='again')row.correct++;row.rate=row.correct/row.total;map.set(key,row);}
 return [...map.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
export function ratingBreakdown(history,range='30',now=new Date()){
 const counts={again:0,hard:0,good:0,easy:0};
 for(const h of filterHistory(history,range,now)){if(String(h.review_type).toLowerCase()==='new')continue;const r=String(h.rating).toLowerCase();if(r in counts)counts[r]++;}
 const total=Object.values(counts).reduce((a,b)=>a+b,0);return{counts,total,percentages:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,total?v/total:0]))};
}
export function upcomingReviews(cards,days=14,now=new Date()){
 const start=new Date(now);start.setHours(0,0,0,0);const rows=[];for(let i=0;i<days;i++){const d=new Date(start);d.setDate(d.getDate()+i);rows.push({date:dayKey(d),count:0});}const byDate=new Map(rows.map(x=>[x.date,x]));
 for(const c of cards){if(c.suspended||c.type==='new'||!c.due_date)continue;const due=String(c.due_date).slice(0,10);if(due<rows[0].date)rows[0].count++;else byDate.get(due)&&(byDate.get(due).count++);}
 return rows;
}
export function cardStatus(cards){const out={new:0,learning:0,mature:0,suspended:0};for(const c of cards){if(c.suspended){out.suspended++;continue;}if(c.type==='new'){out.new++;continue;}if(Number(c.interval||0)>21)out.mature++;else out.learning++;}return out;}
export function reportSummary(cards,history,range='30',now=new Date()){
 const activity=dailyActivity(history,range,now),retention=dailyRetention(history,range,now),ratings=ratingBreakdown(history,range,now),status=cardStatus(cards),newCards=activity.reduce((n,x)=>n+x.new,0),reviewed=activity.reduce((n,x)=>n+x.reviewed,0),correct=retention.reduce((n,x)=>n+x.correct,0),reviewAttempts=retention.reduce((n,x)=>n+x.total,0);
 return{newCards,reviewed,total:newCards+reviewed,retention:reviewAttempts?correct/reviewAttempts:null,mature:status.mature,ratings,status};
}
