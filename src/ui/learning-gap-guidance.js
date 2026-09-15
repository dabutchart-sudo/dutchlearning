function adjustGapQuestion(){
 const qType=document.querySelector('.question-card .q-type');
 if(!qType||qType.textContent.trim()!=='Fill the missing form')return;
 const input=document.getElementById('typed-answer');
 const prompt=document.querySelector('.question-card .prompt');
 if(input){
  input.placeholder='Missing word only';
  input.setAttribute('aria-label','Type only the missing Dutch word');
 }
 if(prompt&&!document.querySelector('.gap-instruction')){
  prompt.insertAdjacentHTML('afterend','<p class="gap-instruction muted small">Type only the word that belongs in the blank.</p>');
 }
}

const host=document.getElementById('content');
if(host){
 const observer=new MutationObserver(adjustGapQuestion);
 observer.observe(host,{subtree:true,childList:true});
 adjustGapQuestion();
}
