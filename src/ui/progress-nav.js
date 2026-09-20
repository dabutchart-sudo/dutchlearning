const panes=[
 {id:'evidence',label:'Evidence',trigger:'#evidence-tab'},
 {id:'mistakes',label:'Mistakes',trigger:'[data-view="mistakes"]'},
 {id:'words',label:'Words',trigger:'#words-tab'}
];

function detectPane(content){
 if(!content)return null;
 if(content.querySelector('[data-course-evidence]'))return 'evidence';
 if(content.querySelector('.word-browser'))return 'words';
 if(content.querySelector('.mistakes-view'))return 'mistakes';
 return null;
}

function openPane(id){
 const pane=panes.find(item=>item.id===id);
 const trigger=pane?document.querySelector(pane.trigger):null;
 if(trigger)trigger.click();
}

function bindSwitcher(bar){
 bar.querySelectorAll('[data-progress-pane]').forEach(button=>{
  button.onclick=()=>openPane(button.dataset.progressPane);
 });
}

function switcherMarkup(current){
 return panes.map(pane=>`<button type="button" data-progress-pane="${pane.id}" aria-pressed="${pane.id===current}">${pane.label}</button>`).join('');
}

function markPrimary(id){
 const primary=document.getElementById(id);
 document.querySelectorAll('.tabs > .tab').forEach(tab=>tab.classList.toggle('active',tab===primary));
}

function syncProgressChrome(){
 const content=document.getElementById('content');
 const progressTab=document.getElementById('progress-tab');
 const report=content?.querySelector('.report-view');
 const pane=detectPane(content);
 if(report){
  content.querySelector('[data-progress-switch]')?.remove();
  markPrimary('flashcards-preview-tab');
  return;
 }
 if(!pane){
  content?.querySelector('[data-progress-switch]')?.remove();
  progressTab?.classList.remove('active');
  return;
 }
 markPrimary('progress-tab');
 let bar=content.querySelector('[data-progress-switch]');
 if(!bar){
  bar=document.createElement('div');
  bar.dataset.progressSwitch='true';
  bar.className='progress-switch course-switch';
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','Progress view');
  bar.innerHTML=switcherMarkup(pane);
  bindSwitcher(bar);
  content.prepend(bar);
  return;
 }
 bar.querySelectorAll('[data-progress-pane]').forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.progressPane===pane));
 });
}

document.getElementById('progress-tab')?.addEventListener('click',()=>openPane('evidence'));
const root=document.getElementById('content');
if(root)new MutationObserver(syncProgressChrome).observe(root,{childList:true,subtree:true});
syncProgressChrome();
