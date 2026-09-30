import {STORAGE_KEY} from '../engine/persistence.js';
import {dayKey} from '../engine/util.js';

export function flashcardsChromeState(storage=globalThis.localStorage,today=dayKey()){
 try{
  if(!storage)return 'ready';
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(key&&key.startsWith('dutch_flashcards_completed_v1:')&&key.endsWith(':'+today)&&storage.getItem(key)==='complete')return 'done';
  }
 }catch{}
 return 'ready';
}

export function learningChromeLabel({count=0,done=false}={}){
 return done||count>=20?'Learning complete':'Learning to do';
}

export function flashcardsChromeLabel(state='ready'){
 return state==='done'?'Flashcards complete':'Flashcards to do';
}

export function learningChromeFromStorage(storage=globalThis.localStorage,today=dayKey()){
 try{
  const state=JSON.parse(storage?.getItem(STORAGE_KEY)||'{}')||{};
  const count=state.daily?.date===today?Number(state.daily.count)||0:0;
  return {count,done:count>=20,extra:state.pending?.phase==='extra'||!!state.extra};
 }catch{
  return {count:0,done:false,extra:false};
 }
}

export function paintDailyChrome(opts={}){
 const host=document.getElementById('daily-chrome');
 if(!host)return;
 const stored=opts.count==null?learningChromeFromStorage():null;
 const count=opts.count??stored.count;
 const done=opts.done??stored.done;
 const testReady=opts.testReady??host.dataset.testReady==='true';
 const extra=opts.extra??stored?.extra??false;
 const cards=opts.flashcards||flashcardsChromeState();
 host.innerHTML=`<span data-daily-learning>${learningChromeLabel({count,done,testReady})}</span><span data-daily-flashcards>${flashcardsChromeLabel(cards)}</span>`;
 host.dataset.learningDone=String(!!(done||count>=20));
 host.dataset.testReady=String(!!testReady);
 host.dataset.flashcards=cards;
 host.dataset.extra=String(!!extra);
}
