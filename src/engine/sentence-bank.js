const clean=value=>String(value??'').trim();
const canonical=value=>clean(value).toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export const SENTENCE_BANK_TARGET=5;
export const SENTENCE_BANK_MAX=10;
export const SENTENCE_BANK_REFRESH_DAYS=30;

export function normalizeSentencePair(pair={},source='generated',index=0){
 const nl=clean(pair.nl??pair.dutch),en=clean(pair.en??pair.english);
 if(!nl||!en)throw new Error('Sentence pairs need both Dutch and English text.');
 return {id:clean(pair.id)||`${source}:${index}:${canonical(nl)}`,nl,en,source:clean(pair.source)||source,createdAt:pair.createdAt??pair.created_at??null};
}

export function fallbackSentenceForCard(card){
 const nl=clean(card?.dutch_sentence??card?.example?.dutch),en=clean(card?.english_sentence??card?.example?.english);
 if(!nl||!en)return null;
 return normalizeSentencePair({id:`card:${card.id}:current`,nl,en,source:'card-current'},'card-current');
}

export function mergeSentenceBank(card,stored=[],generated=[]){
 const merged=[],seen=new Set();
 const add=(pair,source,index)=>{try{const item=normalizeSentencePair(pair,source,index),key=`${canonical(item.nl)}|${canonical(item.en)}`;if(seen.has(key))return;seen.add(key);merged.push(item);}catch{}};
 const fallback=fallbackSentenceForCard(card);if(fallback)add(fallback,'card-current',0);
 stored.forEach((x,i)=>add(x,'cached',i));generated.forEach((x,i)=>add(x,'generated',i));
 return merged.slice(0,SENTENCE_BANK_MAX);
}

export function sentenceBankNeedsRefresh(bank=[],now=new Date(),{target=SENTENCE_BANK_TARGET,maxAgeDays=SENTENCE_BANK_REFRESH_DAYS}={}){
 if(bank.length<target)return true;
 const dated=bank.map(x=>x.createdAt&&new Date(x.createdAt)).filter(d=>d&&!Number.isNaN(d.getTime()));
 if(!dated.length)return false;
 const newest=new Date(Math.max(...dated.map(d=>d.getTime()))),age=(now-newest)/86400000;
 return age>=maxAgeDays;
}

export function chooseSentence(bank=[],{recentIds=[],random=Math.random}={}){
 if(!bank.length)return null;
 const recent=new Set(recentIds.map(String)),fresh=bank.filter(x=>!recent.has(String(x.id))),pool=fresh.length?fresh:bank;
 return pool[Math.min(pool.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*pool.length))];
}

export function sentenceBankRecord(card,stored=[],generated=[],now=new Date()){
 const sentences=mergeSentenceBank(card,stored,generated);
 return {cardId:String(card.id),sentences,needsRefresh:sentenceBankNeedsRefresh(sentences,now),updatedAt:generated.length?now.toISOString():null};
}
