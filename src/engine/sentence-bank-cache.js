export const SENTENCE_BANK_CACHE_PREFIX='dutch_sentence_bank_v1:';
export const SENTENCE_BANK_ACTIVE_URL_KEY='dutch_sentence_bank_active_v1';

const safeParse=value=>{try{const parsed=JSON.parse(value||'{}');return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{};}catch{return{};}};
const validEntry=entry=>entry&&typeof entry==='object'&&Array.isArray(entry.sentences);
const timeOf=entry=>{const time=Date.parse(entry?.updatedAt||'');return Number.isFinite(time)?time:0;};

export function sentenceBankCacheKey(url=''){
 return `${SENTENCE_BANK_CACHE_PREFIX}${String(url||'').trim()}`;
}

export function sentenceBankCacheUrls(storage){
 const urls=[];
 if(!storage)return urls;
 for(let i=0;i<storage.length;i++){
  const key=storage.key(i);
  if(typeof key==='string'&&key.startsWith(SENTENCE_BANK_CACHE_PREFIX))urls.push(key.slice(SENTENCE_BANK_CACHE_PREFIX.length));
 }
 return urls.filter(Boolean);
}

export function rememberSentenceBankUrl(storage,url){
 const clean=String(url||'').trim();
 if(storage&&clean)storage.setItem(SENTENCE_BANK_ACTIVE_URL_KEY,clean);
}

export function preferredSentenceBankUrl(storage){
 const remembered=String(storage?.getItem?.(SENTENCE_BANK_ACTIVE_URL_KEY)||'').trim();
 if(remembered&&storage?.getItem?.(sentenceBankCacheKey(remembered))!==null)return remembered;
 const urls=sentenceBankCacheUrls(storage);
 return urls.length===1?urls[0]:null;
}

export function readSentenceBankCache(storage,url){
 if(!storage||!url)return {};
 return safeParse(storage.getItem(sentenceBankCacheKey(url)));
}

export function writeSentenceBankCache(storage,url,cache){
 if(!storage||!url)return;
 storage.setItem(sentenceBankCacheKey(url),JSON.stringify(cache&&typeof cache==='object'?cache:{}));
 rememberSentenceBankUrl(storage,url);
}

export function cachedSentenceEntry(storage,cardId,{preferredUrl}={}){
 const id=String(cardId??'');
 if(!id||!storage)return null;
 const preferred=String(preferredUrl||preferredSentenceBankUrl(storage)||'').trim();
 const urls=[preferred,...sentenceBankCacheUrls(storage)].filter((url,index,list)=>url&&list.indexOf(url)===index);
 let best=null;
 for(const url of urls){
  const entry=readSentenceBankCache(storage,url)?.[id];
  if(!validEntry(entry))continue;
  const candidate={...entry,url};
  if(!best||timeOf(candidate)>timeOf(best)||(timeOf(candidate)===timeOf(best)&&candidate.sentences.length>best.sentences.length))best=candidate;
 }
 return best;
}

export function sentenceBankEntriesForCards(storage,cards=[]){
 return cards.map(card=>({card,entry:cachedSentenceEntry(storage,card?.id)}));
}
