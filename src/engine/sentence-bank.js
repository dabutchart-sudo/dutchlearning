import {cachedSentenceEntry} from './sentence-bank-cache.js';
const clean=value=>String(value??'').trim();
const canonical=value=>clean(value).toLocaleLowerCase('nl-NL').replace(/[.!?]+$/,'').replace(/\s+/g,' ');
export const SENTENCE_BANK_TARGET=5;
export const SENTENCE_BANK_MAX=10;
export const SENTENCE_BANK_REFRESH_DAYS=30;

const words=text=>canonical(text).match(/\p{L}+(?:['’]\p{L}+)*/gu)||[];
const verbType=card=>/\bverb\b|\bwerkwoord\b|^ww\.?$/i.test(clean(card?.partofword??card?.partOfSpeech));
// A conservative lexical guard, not a Dutch parser or a translation assessor.
// Unknown inflections fall back to the saved card example rather than a synonym.
const irregularForms={
 houden:['hou','houd','houdt','hield','hielden','gehouden'],
 zijn:['ben','bent','is','was','waren','geweest'],
 hebben:['heb','hebt','heeft','had','hadden','gehad'],
 gaan:['ga','gaat','ging','gingen','gegaan'],
 komen:['kom','komt','kwam','kwamen','gekomen'],
 doen:['doe','doet','deed','deden','gedaan'],
 zien:['zie','ziet','zag','zagen','gezien'],
 nemen:['neem','neemt','nam','namen','genomen'],
 geven:['geef','geeft','gaf','gaven','gegeven'],
 eten:['eet','at','aten','gegeten'],
 drinken:['drink','drinkt','dronk','dronken','gedronken'],
 spreken:['spreek','spreekt','sprak','spraken','gesproken'],
 schrijven:['schrijf','schrijft','schreef','schreven','geschreven'],
 lezen:['lees','leest','las','lazen','gelezen'],
 lopen:['loop','loopt','liep','liepen','gelopen'],
 rijden:['rijd','rijdt','reed','reden','gereden'],
 vinden:['vind','vindt','vond','vonden','gevonden'],
 denken:['denk','denkt','dacht','dachten','gedacht'],
 brengen:['breng','brengt','bracht','brachten','gebracht'],
 kopen:['koop','koopt','kocht','kochten','gekocht'],
 weten:['weet','wist','wisten','geweten'],
 worden:['word','wordt','werd','werden','geworden'],
 blijven:['blijf','blijft','bleef','bleven','gebleven'],
 staan:['sta','staat','stond','stonden','gestaan'],
 zitten:['zit','zat','zaten','gezeten'],
 liggen:['lig','ligt','lag','lagen','gelegen'],
 kunnen:['kan','kunt','kon','konden','gekund'],
 moeten:['moet','moest','moesten','gemoeten'],
 mogen:['mag','mocht','mochten','gemogen'],
 willen:['wil','wilt','wou','wouden','wilde','wilden','gewild']
};
function verbForms(infinitive){
 if(irregularForms[infinitive])return new Set([infinitive,...irregularForms[infinitive]]);
 if(!infinitive.endsWith('en')||infinitive.length<4)return new Set([infinitive]);
 let stem=infinitive.slice(0,-2);
 if(/([^aeiou])\1$/.test(stem))stem=stem.slice(0,-1);
 else if(/[^aeiou][aeou][^aeiou]$/.test(stem))stem=stem.slice(0,-1)+stem.slice(-2,-1)+stem.slice(-1);
 stem=stem.replace(/v$/,'f').replace(/z$/,'s');
 return new Set([infinitive,stem,stem.endsWith('t')?stem:stem+'t',stem+'te',stem+'ten',stem+'de',stem+'den','ge'+stem+'t','ge'+stem+'d']);
}
const particles=['samen','tegen','terug','voor','door','over','vast','aan','af','bij','in','mee','na','om','op','toe','uit','weg'];
export function sentenceUsesCardWord(card,sentence){
 let target=words(card?.dutch);
 if(!verbType(card)&&target.length>1&&['de','het'].includes(target[0]))target=target.slice(1);
 if(!target.length)return false;
 const clauses=String(sentence??'').split(/[.!?;,:]/u).map(words);
 if(clauses.some(tokens=>tokens.some((_,i)=>target.every((word,j)=>tokens[i+j]===word))))return true;
 if(!verbType(card)||target.length!==1)return false;
 const verb=target[0],forms=verbForms(verb);
 if(clauses.some(tokens=>tokens.some(token=>forms.has(token))))return true;
 const particle=particles.find(prefix=>{const base=verb.slice(prefix.length);return verb.startsWith(prefix)&&base.length>2&&(irregularForms[base]||base.endsWith('en'));});
 if(!particle)return false;
 const baseForms=verbForms(verb.slice(particle.length));
 return clauses.some(tokens=>tokens.some((token,i)=>{
  if([...baseForms].some(form=>token===particle+form))return true;
  // Main clause: houdt ... op. Infinitive: op te houden.
  if(baseForms.has(token)&&tokens.slice(i+1,i+9).includes(particle))return true;
  return token===particle&&(baseForms.has(tokens[i+1])||(tokens[i+1]==='te'&&baseForms.has(tokens[i+2])));
 }));
}

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

const reviewSentence={recentIds:[],shown:null};
export function resetShownReviewSentence(){reviewSentence.shown=null;reviewSentence.recentIds.length=0;}
export function shownReviewSentence(card,storage,{random=Math.random}={}){
 const cardId=String(card?.id??'');
 if(reviewSentence.shown?.cardId===cardId)return reviewSentence.shown.pair;
 const stored=cachedSentenceEntry(storage,card?.id)?.sentences||[];
 // Filter at display time so existing bad caches are covered without rewriting
 // them or making the generation readiness checks trigger extra paid requests.
 const fallback=fallbackSentenceForCard(card);
 const bank=mergeSentenceBank(card,stored,[]).filter(pair=>
  (fallback&&canonical(pair.nl)===canonical(fallback.nl)&&canonical(pair.en)===canonical(fallback.en))||sentenceUsesCardWord(card,pair.nl));
 const pair=chooseSentence(bank,{recentIds:reviewSentence.recentIds,random});
 if(pair){reviewSentence.recentIds.push(String(pair.id));while(reviewSentence.recentIds.length>8)reviewSentence.recentIds.shift();}
 reviewSentence.shown={cardId,pair:pair||null};
 return pair;
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
