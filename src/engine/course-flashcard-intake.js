// DAB-182: taught course words reach Flashcards through the existing new-card
// allowance. Owner decisions, 5 October 2026:
// - only headwords, eligible from the study day after they are first taught;
// - a word is its linked card, or the one card with the same Dutch text, or none;
// - course cards take up to three of the day's new cards; the rest keep card-ID order;
// - no new cards are created, and nothing new is stored.
export const COURSE_INTAKE_ENABLED=true;
export const COURSE_NEW_CARD_SHARE=3;

// Lower case, no closing or inner punctuation, single spaces. An article stays
// part of the text, so "de appel" never matches "appel".
export function cardText(value){
 return String(value??'').normalize('NFC').toLocaleLowerCase('nl-NL').replace(/[.!?,;:]/g,'').replace(/\s+/g,' ').trim();
}

// Course headwords in course order: words linked to a card, and single-word
// entries. Inflected forms, phrases and support-only entries are left out.
export function courseHeadwords(content){
 const words=new Map();
 for(const sentence of content?.sentences||[]){
  for(const word of sentence.vocabulary||[]){
   if(!word?.id||words.has(word.id)||word.supportOnly)continue;
   const text=cardText(word.nl);
   if(!text)continue;
   if(!word.sourceCardId&&text.includes(' '))continue;
   words.set(word.id,Object.freeze({id:word.id,nl:word.nl,text,sourceCardId:word.sourceCardId?String(word.sourceCardId):null,order:words.size}));
  }
 }
 return [...words.values()];
}

// Linked card first; otherwise exactly one card with the same Dutch text.
// No match, or more than one, means no card.
export function matchCourseWords(headwords,cards){
 const byId=new Map((cards||[]).map(card=>[String(card.id),card]));
 const byText=new Map();
 for(const card of cards||[]){const text=cardText(card.dutch);if(!text)continue;byText.set(text,[...(byText.get(text)||[]),card]);}
 const matched=[],unmatched=[],ambiguous=[];
 for(const word of headwords){
  if(word.sourceCardId&&byId.has(word.sourceCardId)){matched.push({word,card:byId.get(word.sourceCardId)});continue;}
  const candidates=byText.get(word.text)||[];
  if(candidates.length===1)matched.push({word,card:candidates[0]});
  else if(candidates.length>1)ambiguous.push(word);
  else unmatched.push(word);
 }
 return {matched,unmatched,ambiguous};
}

function taughtDay(learnerState,wordId){
 const taught=learnerState?.words?.[wordId]?.taughtAt;
 return typeof taught==='string'&&/^\d{4}-\d{2}-\d{2}/.test(taught)?taught.slice(0,10):null;
}

// Which still-new cards the course puts first today, and how many of today's
// new cards it may still take. Cards already in review are never included.
export function courseNewCardPriority({content,learnerState,cards,today,share=COURSE_NEW_CARD_SHARE,enabled=COURSE_INTAKE_ENABLED}={}){
 const none=Object.freeze({cardIds:Object.freeze([]),share:0,waiting:0,unmatched:Object.freeze([]),ambiguous:Object.freeze([])});
 if(!enabled||!content||!Array.isArray(cards)||!today)return none;
 const {matched,unmatched,ambiguous}=matchCourseWords(courseHeadwords(content),cards);
 const courseCardIds=new Set(matched.map(entry=>String(entry.card.id)));
 const introducedToday=cards.filter(card=>courseCardIds.has(String(card.id))&&card.first_seen&&String(card.first_seen).slice(0,10)===today).length;
 const earliest=new Map();
 for(const {word,card} of matched){
  if(card.suspended||card.type!=='new')continue;
  const taught=taughtDay(learnerState,word.id);
  if(!taught||taught>=today)continue;
  const id=String(card.id),known=earliest.get(id);
  if(!known||taught<known.taught||(taught===known.taught&&word.order<known.order))earliest.set(id,{taught,order:word.order});
 }
 const cardIds=[...earliest].sort((a,b)=>a[1].taught.localeCompare(b[1].taught)||a[1].order-b[1].order).map(([id])=>id);
 return Object.freeze({
  cardIds:Object.freeze(cardIds),
  share:Math.max(0,Math.trunc(share)-introducedToday),
  waiting:cardIds.length,
  // Only taught words are listed: those are the ones waiting for a card.
  unmatched:Object.freeze(unmatched.filter(word=>{const day=taughtDay(learnerState,word.id);return day&&day<today;}).map(word=>word.nl)),
  ambiguous:Object.freeze(ambiguous.filter(word=>{const day=taughtDay(learnerState,word.id);return day&&day<today;}).map(word=>word.nl))
 });
}
