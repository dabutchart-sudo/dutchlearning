import {tokens,normalize,shuffle,uid,sentenceCase,displayTokens} from './util.js';
export const kinds=['choice','wordbank','gap','correct-sentence','correction','form','listening','typed'];
export function wordBank(text,distractors,seed){const needed=displayTokens(sentenceCase(text));const other=[...new Set(distractors.flatMap(tokens))].filter(w=>!needed.map(normalize).includes(w));return shuffle([...needed,...shuffle(other,seed).slice(0,3)].map((text,i)=>({id:'tile-'+i,text})),seed)}
export function chooseTile(selection,tileId,bank){if(!bank.some(t=>t.id===tileId)||selection.includes(tileId))return selection;return [...selection,tileId]}
export const removeTile=(selection,tileId)=>selection.filter(x=>x!==tileId);
export const bankAnswer=(selection,bank)=>selection.map(id=>bank.find(t=>t.id===id)?.text||'').join(' ');
export function makeExercise(item,kind,content,{phase='practice',direction='en-nl',seed=uid()}={}){
 const q={presentationVersion:515,id:uid(),sourceId:item.id,concept:item.concept,kind,phase,direction,answer:item.nl,prompt:item.en,alternatives:item.alternatives,verbIndex:item.verbIndex,verbSlots:item.verbSlots||[item.verbIndex],forms:item.forms,assisted:false};
 const nl=displayTokens(sentenceCase(item.nl));let wrong=[...nl];const wrongForm=item.forms.find(x=>normalize(x)!==normalize(nl[item.verbIndex]));wrong[item.verbIndex]=wrongForm||'werken';
 const bad=sentenceCase(wrong.join(' '));const others=content.sentences.filter(x=>x.concept===item.concept&&x.pool==='practice'&&normalize(x.en)!==normalize(item.en));
 if(kind==='choice'||kind==='listening'){
  q.direction='nl-en';q.prompt=kind==='listening'?'Listen, then choose the meaning.':item.nl;q.answer=item.en;
  // Prefer distractors sharing a subject or verb: real, controlled sentence meanings.
  const near=shuffle(others.filter(x=>x.subject===item.subject||x.verb===item.verb),seed);
  q.options=shuffle([item.en,...[...new Set([...near,...others].map(x=>x.en))].slice(0,3)],seed);q.audio=item.nl;
 }else if(kind==='wordbank')q.bank=wordBank(item.nl,[...item.forms,'ik wij hij zij de het een niet',...others.slice(0,12).map(x=>x.nl)],seed);
 else if(kind==='gap'||kind==='form'){
  q.prompt=nl.map((w,i)=>i===item.verbIndex?'_____':w).join(' ');q.cue=item.en;q.answer=nl[item.verbIndex];q.alternatives=[];
  if(kind==='form')q.options=shuffle([...new Set([q.answer,...item.forms].map(w=>item.verbIndex===0?sentenceCase(w):w))],seed);
 }else if(kind==='correct-sentence'){
  const reversed=[...nl];[reversed[0],reversed[1]]=[reversed[1],reversed[0]];
  q.options=shuffle([...new Set([item.nl,bad,sentenceCase(reversed.map((w,i)=>i===1?normalize(w):w).join(' '))])],seed);
 }else if(kind==='correction'){q.prompt=maskedCorrection(item);q.cue=item.en;}
 return q;
}

// Mask the model's suffix, rather than displaying the erroneous form or its location in colour.
export function maskedCorrection(item){
 const words=displayTokens(sentenceCase(item.nl));
 const letters=Array.from(words[item.verbIndex]);
 const count=Math.min(letters.length,Math.max(2,Math.ceil(letters.length/2)));
 words[item.verbIndex]=letters.slice(0,letters.length-count).join('')+'_'.repeat(count);
 return words.join(' ')+(item.nl.match(/[.!?]$/)?.[0]||'.');
}
// Compare normalized whole words so sentence case never obscures the grammatical difference.
export function sentenceDifference(actual,expected){
 const got=tokens(actual);
 return displayTokens(sentenceCase(expected)).map((text,i)=>({text,changed:normalize(text)!==got[i]}));
}
export function correctiveFeedback(q,item,raw,result){
 const fullAnswer=['gap','form'].includes(q.kind)?displayTokens(item.nl).map((w,i)=>i===item.verbIndex?raw:w).join(' '):raw;
 const compare=q.direction==='en-nl'&&!(result.grammar===true&&result.spelling!==false);
 const words=sentenceDifference(compare?fullAnswer:item.nl,item.nl);
 const actual=displayTokens(fullAnswer);
 const explanation=result.errorType==='verb_form'&&!['F6','A1.6'].includes(q.concept)?`With ${item.subject}, ${item.verb} becomes ${displayTokens(item.nl)[item.verbIndex]}.`:result.tip;
 return {words,explanation,punctuation:item.nl.match(/[.!?]$/)?.[0]||'.',meaning:item.en,
  differences:compare?words.flatMap((w,i)=>w.changed&&actual[i]?[`${actual[i]} → ${w.text}`]:[]):[]};
}
