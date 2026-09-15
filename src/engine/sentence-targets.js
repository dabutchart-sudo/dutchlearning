const datePart=value=>value?String(value).slice(0,10):'';
const numericId=value=>{const n=Number(value);return Number.isFinite(n)?n:Number.MAX_SAFE_INTEGER;};

export function sentenceGenerationTargets(cards,{today,maxNew=5}={}){
 const day=today||new Date().toISOString().slice(0,10);
 const active=(cards||[]).filter(card=>card&&!card.suspended);
 const due=active
  .filter(card=>card.type!=='new'&&datePart(card.due_date)&&datePart(card.due_date)<=day)
  .sort((a,b)=>(Number(b.lapses||0)-Number(a.lapses||0))||datePart(a.due_date).localeCompare(datePart(b.due_date))||numericId(a.id)-numericId(b.id));
 const fresh=active
  .filter(card=>card.type==='new'&&!card.first_seen)
  .sort((a,b)=>numericId(a.id)-numericId(b.id))
  .slice(0,Math.max(0,Number(maxNew)||0));
 return [...due,...fresh];
}
