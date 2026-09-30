const states={
 learning:{kind:'checking',detail:'Checking Learning sync'},
 flashcards:{kind:'not-checked',detail:'Open Flashcards to check its connection'}
};

export function syncLabel({learning,flashcards}){
 if(learning.kind==='error'||flashcards.kind==='error')return {text:'Sync needs attention',tone:'error'};
 if(learning.kind==='offline'||flashcards.kind==='offline')return {text:'Offline · check details',tone:'offline'};
 if(flashcards.kind==='saving')return {text:'Saving Flashcards',tone:'working'};
 if(learning.kind==='local')return {text:'Saved on this device',tone:'local'};
 if(learning.kind==='syncing')return {text:'Syncing Learning',tone:'working'};
 if(learning.kind==='synced'&&['connected','saved'].includes(flashcards.kind))return {text:'Learning and Flashcards connected',tone:'good'};
 if(learning.kind==='synced')return {text:'Learning synced · Flashcards not checked',tone:'working'};
 return {text:'Checking sync',tone:'working'};
}

export function updateSyncState(area,kind,detail,at=new Date()){
 if(!Object.prototype.hasOwnProperty.call(states,area))return;
 states[area]={kind,detail,at};
 paintSyncState();
}

function timeLabel(at){
 return at?.toLocaleTimeString?.([], {hour:'2-digit',minute:'2-digit'})||'';
}

function paintSyncState(){
 const trigger=document.getElementById('sync-status');
 if(!trigger)return;
 const summary=syncLabel(states);
 trigger.dataset.tone=summary.tone;
 trigger.setAttribute('aria-label',`${summary.text}. Open sync details`);
 trigger.title=`${summary.text}. Open sync details`;
 for(const area of ['learning','flashcards']){
  const row=document.querySelector(`[data-sync-area="${area}"]`);
  if(!row)continue;
  const state=states[area];
  row.dataset.state=state.kind;
  row.querySelector('.sync-detail').textContent=state.detail;
  row.querySelector('time').textContent=['synced','connected','saved'].includes(state.kind)?timeLabel(state.at):'';
 }
}

function updateCurrentNav(){
 document.querySelectorAll('.tabs > .tab').forEach(tab=>{
  if(tab.classList.contains('active'))tab.setAttribute('aria-current','page');
  else tab.removeAttribute('aria-current');
 });
}

if(globalThis.document){
 const dialog=document.getElementById('sync-details');
 document.getElementById('sync-status')?.addEventListener('click',()=>dialog?.showModal());
 dialog?.querySelector('[data-close-sync]')?.addEventListener('click',()=>dialog.close());
 dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 document.addEventListener('zin:sync-status',event=>updateSyncState('learning',event.detail.kind,event.detail.text));
 document.addEventListener('zin:flashcards-status',event=>updateSyncState('flashcards',event.detail.kind,event.detail.text));
 window.addEventListener('offline',()=>{
  updateSyncState('learning','offline','Learning answers remain saved on this device');
  updateSyncState('flashcards','offline','Flashcards need a connection to load or save');
 });
 window.addEventListener('online',()=>{
  updateSyncState('learning','checking','Checking Learning sync');
  updateSyncState('flashcards','not-checked','Open Flashcards to check its connection');
 });
 const tabs=document.querySelector('.tabs');
 if(tabs)new MutationObserver(updateCurrentNav).observe(tabs,{subtree:true,attributes:true,attributeFilter:['class']});
 updateCurrentNav();
 if(!navigator.onLine){
  states.learning={kind:'offline',detail:'Learning answers remain saved on this device'};
  states.flashcards={kind:'offline',detail:'Flashcards need a connection to load or save'};
 }
 paintSyncState();
 setTimeout(()=>{
  if(states.learning.kind==='checking')updateSyncState('learning','error','Learning sync could not be verified');
 },12000);
}
