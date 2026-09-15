export const BRIEFING_STORAGE_KEY='dutch_learning_vocab_briefing_v1';

export function sessionVocabulary(content,conceptId){
 const unique=new Map();
 for(const item of content.sentences.filter(x=>x.concept===conceptId&&x.pool==='practice')){
  for(const word of item.vocabulary||[])if(!unique.has(word.id))unique.set(word.id,word);
 }
 return [...unique.values()].sort((a,b)=>Number(a.mature)-Number(b.mature)||a.nl.localeCompare(b.nl,'nl'));
}

function readMap(storage){
 try{return JSON.parse(storage.getItem(BRIEFING_STORAGE_KEY)||'{}')||{};}catch{return {};}
}

export function briefingDone(storage,date,conceptId){return !!readMap(storage)[`${date}:${conceptId}`];}

export function rememberBriefing(storage,date,conceptId){
 const map=readMap(storage);map[`${date}:${conceptId}`]=true;
 const keep=Object.fromEntries(Object.entries(map).sort(([a],[b])=>b.localeCompare(a)).slice(0,20));
 storage.setItem(BRIEFING_STORAGE_KEY,JSON.stringify(keep));
}
