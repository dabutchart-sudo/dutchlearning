const clean=value=>String(value??'').trim();

export function visualCueForRecord(record={}){
 const raw=clean(record.image_url??record.imageUrl??record.image?.url);
 if(!raw)return null;
 let url;
 try{url=new URL(raw);}catch{return null;}
 if(!['http:','https:'].includes(url.protocol))return null;
 return {url:url.toString(),alt:'Visual memory cue'};
}

export function supportSequenceForMiss(record={},attempt={}){
 const type=attempt?.errorType==='spelling'?'spelling':'recall';
 if(type==='spelling')return ['spelling'];
 return visualCueForRecord(record)?['visual','spelling']:['spelling'];
}

export function shouldOfferVisualCue(record={},attempt={}){
 return supportSequenceForMiss(record,attempt)[0]==='visual';
}
