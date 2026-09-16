const FLIP_MS=600;
const HALF_FLIP_MS=FLIP_MS/2;
let animating=false;
let bypassNextClick=false;

function reducedMotion(){
 return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
}

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

async function animateHalf(card,from,to,easing){
 if(reducedMotion())return;
 card.style.transformOrigin='center center';
 card.style.willChange='transform';
 card.style.transform=`perspective(1000px) rotateY(${from}deg)`;
 card.style.transition='none';
 // Force the start transform to be painted before enabling the transition.
 void card.offsetWidth;
 card.style.transition=`transform ${HALF_FLIP_MS}ms ${easing}`;
 card.style.transform=`perspective(1000px) rotateY(${to}deg)`;
 await wait(HALF_FLIP_MS);
}

function clearAnimationStyles(card){
 if(!card)return;
 card.style.transition='';
 card.style.transform='';
 card.style.transformOrigin='';
 card.style.willChange='';
}

async function flipReviewCard(card){
 animating=true;
 try{
  await animateHalf(card,0,90,'ease-in');

  // Use the existing Flashcard click handler for the actual Dutch/English state change.
  // This module stays visual only: no SRS, rating, session or database state is written here.
  bypassNextClick=true;
  card.click();
  bypassNextClick=false;

  const incoming=document.getElementById('review-card');
  if(incoming){
   await animateHalf(incoming,-90,0,'ease-out');
   clearAnimationStyles(incoming);
  }
 }finally{
  bypassNextClick=false;
  clearAnimationStyles(card);
  animating=false;
 }
}

document.addEventListener('click',event=>{
 const card=event.target.closest?.('#review-card');
 if(!card||event.target.closest?.('#speak-card'))return;

 // The midpoint click must reach flashcards-preview.js unchanged.
 if(bypassNextClick)return;

 if(animating){
  event.preventDefault();
  event.stopImmediatePropagation();
  return;
 }

 event.preventDefault();
 event.stopImmediatePropagation();
 void flipReviewCard(card);
},true);
