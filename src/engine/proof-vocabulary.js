import {normalize,tokens} from './util.js';

export const needsPersonalVocabulary=id=>/^A1\.(?:[7-9]|1\d|2[01])$/.test(id);

export function practisedWords(state,content){
 const words=new Set();
 for(const attempt of state.attempts||[]){
  if(!['practice','maintenance','extra'].includes(attempt.phase))continue;
  const item=content.byId[attempt.sourceId];
  const sentence=item?.pool==='practice'?item.nl:attempt.correctSentence;
  if(sentence)for(const word of tokens(sentence))words.add(word);
 }
 return words;
}

export function eligibleProof(state,content,concept){
 const seen=new Set((state.exposures||[]).map(x=>x.nl));
 const familiar=needsPersonalVocabulary(concept)?practisedWords(state,content):null;
 return content.sentences.filter(item=>item.concept===concept&&item.pool==='proof'&&
  !seen.has(normalize(item.nl))&&(!familiar||tokens(item.nl).every(word=>familiar.has(word))));
}

export function proofVocabularyNeed(state,content,concept,type){
 if(!needsPersonalVocabulary(concept))return null;
 const seen=new Set((state.exposures||[]).map(x=>x.nl));
 const potential=content.sentences.filter(item=>item.concept===concept&&item.pool==='proof'&&!seen.has(normalize(item.nl))).length;
 const available=eligibleProof(state,content,concept).length;
 const required=type==='retention'?10:30; // A 20-item mastery also reserves ten unseen retention items.
 return {available,potential,required,missing:Math.max(0,required-available)};
}

export function practiceVocabularyGain(item,state,content,concept){
 if(!needsPersonalVocabulary(concept))return 0;
 const familiar=practisedWords(state,content),introduced=new Set(tokens(item.nl));
 const unseen=content.sentences.filter(row=>row.concept===concept&&row.pool==='proof'&&
  !(state.exposures||[]).some(exposure=>exposure.nl===normalize(row.nl)));
 let newlyEligible=0;
 for(const row of unseen){
  const missing=tokens(row.nl).filter(word=>!familiar.has(word));
  if(missing.length&&missing.every(word=>introduced.has(word)))newlyEligible++;
 }
 const newWords=[...introduced].filter(word=>!familiar.has(word)).length;
 return newlyEligible*20+newWords*2;
}
