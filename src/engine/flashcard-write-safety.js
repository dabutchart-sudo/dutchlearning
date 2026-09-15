export const SRS_FIELDS=['type','interval','ease','reps','lapses','first_seen','last_reviewed','due_date'];

export function parseJsonBody(body){
 if(body==null)return null;
 if(typeof body==='object'&&!(body instanceof String))return body;
 try{return JSON.parse(String(body));}catch{return null;}
}

export function isSchedulingPatch(url,options={}){
 if(String(options.method||'GET').toUpperCase()!=='PATCH')return false;
 if(!/\/rest\/v1\/cards\?id=eq\./.test(String(url)))return false;
 const body=parseJsonBody(options.body);
 return Boolean(body&&SRS_FIELDS.every(field=>Object.prototype.hasOwnProperty.call(body,field)));
}

export function isReviewHistoryPost(url,options={}){
 return String(options.method||'GET').toUpperCase()==='POST'&&/\/rest\/v1\/reviewhistory(?:\?|$)/.test(String(url));
}

export function srsSnapshot(card={}){
 return Object.fromEntries(SRS_FIELDS.map(field=>[field,card[field]??null]));
}

export function historyIdentity(row={}){
 const cardid=row.cardid??row.card_id;
 const timestamp=row.timestamp;
 return cardid!=null&&timestamp?{cardid:String(cardid),timestamp:String(timestamp)}:null;
}
