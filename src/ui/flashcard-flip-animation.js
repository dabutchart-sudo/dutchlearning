const FLIP_MS=600;

function installFlipStyle(){
 const style=document.createElement('style');
 style.textContent=`
  .flashcard-review-card{transform-style:preserve-3d;backface-visibility:hidden;will-change:transform}
  .flashcard-review-card.flashcard-flip-out{animation:zin-card-flip-out ${FLIP_MS/2}ms ease-in forwards}
  .flashcard-review-card.flashcard-flip-in{animation:zin-card-flip-in ${FLIP_MS/2}ms ease-out both}
  @keyframes zin-card-flip-out{from{transform:rotateY(0deg)}to{transform:rotateY(90deg)}}
  @keyframes zin-card-flip-in{from{transform:rotateY(-90deg)}to{transform:rotateY(0deg)}}
  @media(prefers-reduced-motion:reduce){.flashcard-review-card.flashcard-flip-out,.flashcard-review-card.flashcard-flip-in{animation-duration:1ms}}
 `;
 document.head.appendChild(style);
}

let completingFlip=false,expectIncoming=false;

document.addEventListener('click',event=>{
 const card=event.target.closest?.('#review-card');
 if(!card||event.target.closest('#speak-card')||completingFlip)return;
 event.preventDefault();
 event.stopImmediatePropagation();
 completingFlip=true;
 card.classList.add('flashcard-flip-out');
 const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?1:FLIP_MS/2;
 setTimeout(()=>{
  expectIncoming=true;
  completingFlip=false;
  card.click();
 },delay);
},true);

const host=document.getElementById('content');
if(host){
 const observer=new MutationObserver(()=>{
  if(!expectIncoming)return;
  const card=document.getElementById('review-card');
  if(!card)return;
  expectIncoming=false;
  card.classList.add('flashcard-flip-in');
 });
 observer.observe(host,{subtree:true,childList:true});
}

installFlipStyle();
