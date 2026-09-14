export const SENTENCE_QUEUE_KEY='dutch_flashcards_sentence_queue';

export function outstandingFlagIds(storage=localStorage){
 try{
  const parsed=JSON.parse(storage.getItem(SENTENCE_QUEUE_KEY)||'[]');
  if(!Array.isArray(parsed))return[];
  return [...new Set(parsed.map(Number).filter(Number.isFinite))];
 }catch{return[];}
}

export function flaggedWordsWarning(count){
 const noun=count===1?'word':'words';
 return `FLAGGED WORDS\n\nYou still have ${count} flagged ${noun} waiting for sentence review.\n\nPress OK to continue with today's Flashcard session anyway, or Cancel to stay here and review ${count===1?'it':'them'} first.`;
}

export function allowFlashcardStart(storage=localStorage,confirmFn=window.confirm.bind(window)){
 const count=outstandingFlagIds(storage).length;
 return !count||confirmFn(flaggedWordsWarning(count));
}

function install(){
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('#start-flashcard-review');
  if(!button||button.disabled)return;
  if(allowFlashcardStart())return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const review=document.getElementById('open-sentence-review');
  review?.scrollIntoView?.({behavior:'smooth',block:'center'});
  review?.focus?.();
 },true);
}

if(typeof document!=='undefined')install();
