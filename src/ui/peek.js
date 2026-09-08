// A reveal has no persistent visible state. Save assistance before showing any words.
export function bindPeek(button,hint,{reveal,onUse,onError=()=>{},window:win=globalThis.window,document:doc=globalThis.document}){
 const controller=new AbortController(),options={signal:controller.signal};
 const idle='Hold to see dictionary words.';
 let held=false,generation=0;
 function stop(){held=false;generation++;hint.textContent=idle;button.setAttribute('aria-pressed','false');}
 async function start(){
  if(held||button.disabled)return;
  held=true;const turn=++generation;
  try{await onUse();if(held&&turn===generation&&button.isConnected){hint.textContent=reveal;button.setAttribute('aria-pressed','true');}}
  catch(error){stop();onError(error);}
 }
 button.style.touchAction='none';
 button.setAttribute('aria-pressed','false');button.setAttribute('aria-describedby',hint.id);stop();
 button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();button.focus();button.setPointerCapture?.(e.pointerId);start();},options);
 for(const event of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur'])button.addEventListener(event,stop,options);
 win.addEventListener('pointerup',stop,options);win.addEventListener('pointercancel',stop,options);win.addEventListener('blur',stop,options);
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden)stop()},options);
 button.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();if(!e.repeat)start();}},options);
 button.addEventListener('keyup',e=>{if([' ','Enter'].includes(e.key)){e.preventDefault();stop();}},options);
 button.addEventListener('click',e=>e.preventDefault(),options);
 button.addEventListener('contextmenu',e=>{e.preventDefault();stop()},options);
 return ()=>{stop();controller.abort();};
}
