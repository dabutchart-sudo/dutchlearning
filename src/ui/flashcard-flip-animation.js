const HALF_FLIP_MS=300;
let animating=false;
let syntheticReveal=false;

function reducedMotion(){
 return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
}

async function animateHalf(card,from,to,easing){
 if(reducedMotion()||typeof card.animate!=='function')return;
 const animation=card.animate(
  [
   {transform:`perspective(1000px) rotateY(${from}deg)`},
   {transform:`perspective(1000px) rotateY(${to}deg)`}
  ],
  {duration:HALF_FLIP_MS,easing,fill:'forwards'}
 );
 try{await animation.finished;}catch{}
}

async function flipReviewCard(card){
 animating=true;
 await animateHalf(card,0,90,'ease-in');

 // Let flashcards-preview.js perform the real front/back state change.
 // That keeps this module purely visual and leaves SRS/session behaviour untouched.
 syntheticReveal=true;
 card.click();
 syntheticReveal=false;

 const incoming=document.getElementById('review-card');
 if(incoming)await animateHalf(incoming,-90,0,'ease-out');
 animating=false;
}

document.addEventListener('click',event=>{
 const card=event.target.closest?.('#review-card');
 if(!card||event.target.closest('#speak-card'))return;

 // The synthetic click must reach the existing Flashcard handler unchanged.
 if(syntheticReveal)return;

 if(animating){
  event.preventDefault();
  event.stopImmediatePropagation();
  return;
 }

 event.preventDefault();
 event.stopImmediatePropagation();
 void flipReviewCard(card);
},true);
