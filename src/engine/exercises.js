import {tokens,normalize,shuffle,uid} from './util.js';
export const kinds=['choice','wordbank','gap','correct-sentence','correction','form','listening','typed'];
export function wordBank(text,distractors,seed){const needed=tokens(text);const other=[...new Set(distractors.flatMap(tokens))].filter(w=>!needed.includes(w));return shuffle([...needed,...shuffle(other,seed).slice(0,3)].map((text,i)=>({id:'tile-'+i,text})),seed)}
export function chooseTile(selection,tileId,bank){if(!bank.some(t=>t.id===tileId)||selection.includes(tileId))return selection;return [...selection,tileId]}
export const removeTile=(selection,tileId)=>selection.filter(x=>x!==tileId);
export const bankAnswer=(selection,bank)=>selection.map(id=>bank.find(t=>t.id===id)?.text||'').join(' ');
export function makeExercise(item,kind,content,{phase='practice',direction='en-nl',seed=uid()}={}){
 const q={id:uid(),sourceId:item.id,concept:item.concept,kind,phase,direction,answer:item.nl,prompt:item.en,alternatives:item.alternatives,verbIndex:item.verbIndex,verbSlots:item.verbSlots||[item.verbIndex],forms:item.forms,assisted:false};
 const nl=tokens(item.nl);let wrong=[...nl];const wrongForm=item.forms.find(x=>normalize(x)!==nl[item.verbIndex]);wrong[item.verbIndex]=wrongForm||'werken';
 const bad=wrong.join(' ');const others=content.sentences.filter(x=>x.concept===item.concept&&x.pool==='practice'&&normalize(x.en)!==normalize(item.en));
 if(kind==='choice'||kind==='listening'){
  q.direction='nl-en';q.prompt=kind==='listening'?'Listen, then choose the meaning.':item.nl;q.answer=item.en;
  // Prefer distractors sharing a subject or verb: real, controlled sentence meanings.
  const near=shuffle(others.filter(x=>x.subject===item.subject||x.verb===item.verb),seed);
  q.options=shuffle([item.en,...[...new Set([...near,...others].map(x=>x.en))].slice(0,3)],seed);q.audio=item.nl;
 }else if(kind==='wordbank')q.bank=wordBank(item.nl,[...item.forms,'ik wij hij zij de het een niet',...others.slice(0,12).map(x=>x.nl)],seed);
 else if(kind==='gap'||kind==='form'){
  q.prompt=nl.map((w,i)=>i===item.verbIndex?'_____':w).join(' ');q.cue=item.en;q.answer=nl[item.verbIndex];q.alternatives=[];
  if(kind==='form')q.options=shuffle([...new Set([q.answer,...item.forms])],seed);
 }else if(kind==='correct-sentence'){
  const reversed=[...nl];[reversed[0],reversed[1]]=[reversed[1],reversed[0]];
  q.options=shuffle([...new Set([item.nl,bad,reversed.join(' ')])],seed);
 }else if(kind==='correction'){q.prompt=bad;q.cue=item.en;}
 return q;
}
