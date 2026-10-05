import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {buildFlashcardQueue,remainingNewCards,applyFlashcardRating} from '../src/engine/flashcards.js';
import {COURSE_NEW_CARD_SHARE,cardText,courseHeadwords,courseNewCardPriority,matchCourseWords} from '../src/engine/course-flashcard-intake.js';

const today='2026-10-05',yesterday='2026-10-04';
const card=(id,dutch,extra={})=>({id,dutch,english:`en ${dutch}`,type:'new',suspended:false,interval:0,ease:2.5,reps:0,lapses:0,due_date:null,first_seen:null,...extra});
const keepOrder=()=>0.5;

function course(words){
 // One sentence per word keeps course order equal to list order.
 return {sentences:words.map((vocabulary,index)=>({id:`s${index}`,concept:'F1',pool:'practice',nl:'x',en:'x',vocabulary:[vocabulary]}))};
}
function taught(map){return {words:Object.fromEntries(Object.entries(map).map(([id,date])=>[id,{taughtAt:date}]))};}
const newIds=queue=>queue.filter(c=>c.type==='new').map(c=>String(c.id)).sort();

test('without a course priority the queue is exactly as before',()=>{
 const cards=[card(5,'vijf'),card(1,'een'),card(3,'drie'),card(9,'negen',{type:'review',due_date:today}),card(2,'twee',{suspended:true})];
 const queue=buildFlashcardQueue(cards,{today,newLimit:2,random:keepOrder});
 assert.deepEqual(newIds(queue),['1','3']);
 assert.ok(queue.some(c=>String(c.id)==='9'));
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:2,random:keepOrder,priorityNewIds:[],priorityLimit:3})),['1','3']);
});

test('course cards take up to the share of the same allowance, and the total never exceeds it',()=>{
 const cards=Array.from({length:10},(_,i)=>card(i+1,`woord${i+1}`));
 const priority=['10','9','8','7'];
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:5,priorityNewIds:priority,priorityLimit:3,random:keepOrder})),['1','10','2','8','9']);
 assert.equal(newIds(buildFlashcardQueue(cards,{today,newLimit:2,priorityNewIds:priority,priorityLimit:3,random:keepOrder})).length,2);
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:2,priorityNewIds:priority,priorityLimit:3,random:keepOrder})),['10','9']);
 for(const limit of [0,1,3,5])for(const share of [0,3,9])assert.ok(newIds(buildFlashcardQueue(cards,{today,newLimit:limit,priorityNewIds:priority,priorityLimit:share,random:keepOrder})).length<=limit);
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:5,priorityNewIds:['99','4'],priorityLimit:3,random:keepOrder})),['1','2','3','4','5']);
});

test('no new cards appear after the Flashcard day is complete',()=>{
 const cards=Array.from({length:6},(_,i)=>card(i+1,`w${i}`));
 const allowance=remainingNewCards({configuredMax:5,introducedToday:0,studyDayComplete:true});
 assert.equal(allowance,0);
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:allowance,priorityNewIds:['1','2'],priorityLimit:3})),[]);
});

test('headwords exclude support-only forms and unlinked phrases',()=>{
 const words=courseHeadwords(course([
  {id:'card:1',nl:'werken',sourceCardId:'1'},
  {id:'word:een appel',nl:'een appel',sourceCardId:'2'},
  {id:'word:in het park',nl:'in het park'},
  {id:'a1surface:gewerkt',nl:'gewerkt',supportOnly:true},
  {id:'a1z:komen',nl:'komen'},
  {id:'card:1',nl:'werken',sourceCardId:'1'}
 ]));
 assert.deepEqual(words.map(word=>word.id),['card:1','word:een appel','a1z:komen']);
 const real=courseHeadwords(registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]));
 assert.ok(real.length>100);
 assert.ok(real.every(word=>word.sourceCardId||!word.text.includes(' ')));
});

test('identity: linked card first, then exactly one same-text card, otherwise none',()=>{
 const cards=[card(1,'werken'),card(2,'Komen.'),card(3,'de appel'),card(4,'huis'),card(5,'huis')];
 const words=courseHeadwords(course([
  {id:'card:1',nl:'werken',sourceCardId:'1'},
  {id:'a1z:komen',nl:'komen'},
  {id:'a1z:appel',nl:'appel'},
  {id:'a1z:huis',nl:'huis'},
  {id:'a1z:fiets',nl:'fiets'},
  {id:'card:77',nl:'werken',sourceCardId:'77'}
 ]));
 const {matched,unmatched,ambiguous}=matchCourseWords(words,cards);
 assert.deepEqual(matched.map(entry=>`${entry.word.id}>${entry.card.id}`),['card:1>1','a1z:komen>2','card:77>1']);
 assert.deepEqual(unmatched.map(word=>word.nl),['appel','fiets']);
 assert.deepEqual(ambiguous.map(word=>word.nl),['huis']);
 assert.equal(cardText(' De  Appel. '),'de appel');
});

test('a word is eligible only from the study day after it is taught, earliest taught first',()=>{
 const content=course([{id:'a',nl:'een',sourceCardId:'1'},{id:'b',nl:'twee',sourceCardId:'2'},{id:'c',nl:'drie',sourceCardId:'3'},{id:'d',nl:'vier',sourceCardId:'4'}]);
 const cards=[card(1,'een'),card(2,'twee'),card(3,'drie'),card(4,'vier')];
 const p=courseNewCardPriority({content,cards,today,learnerState:taught({a:yesterday,b:'2026-09-30',c:today})});
 assert.deepEqual(p.cardIds,['2','1']);
 assert.equal(p.share,COURSE_NEW_CARD_SHARE);
 assert.equal(p.waiting,2);
});

test('only taught words without a single matching card are listed for the owner',()=>{
 const content=course([{id:'a',nl:'fiets'},{id:'b',nl:'huis'},{id:'c',nl:'boek'},{id:'d',nl:'kat'}]);
 const cards=[card(1,'huis'),card(2,'huis')];
 const p=courseNewCardPriority({content,cards,today,learnerState:taught({a:yesterday,b:yesterday,c:today})});
 assert.deepEqual(p.unmatched,['fiets']);
 assert.deepEqual(p.ambiguous,['huis']);
});

test('cards already in review or suspended are never touched',()=>{
 const content=course([{id:'a',nl:'een',sourceCardId:'1'},{id:'b',nl:'twee',sourceCardId:'2'},{id:'c',nl:'drie',sourceCardId:'3'}]);
 const reviewCard=card(1,'een',{type:'review',interval:12,ease:2.3,reps:4,due_date:'2026-10-20',first_seen:'2026-09-01'});
 const before=JSON.stringify(reviewCard);
 const cards=[reviewCard,card(2,'twee',{suspended:true}),card(3,'drie')];
 const p=courseNewCardPriority({content,cards,today,learnerState:taught({a:yesterday,b:yesterday,c:yesterday})});
 assert.deepEqual(p.cardIds,['3']);
 buildFlashcardQueue(cards,{today,newLimit:5,priorityNewIds:['1','2','3'],priorityLimit:3});
 assert.equal(JSON.stringify(reviewCard),before);
});

test('a restarted or second-device session counts course cards already introduced today',()=>{
 const ids=['11','12','13','14','15'];
 const content=course(ids.map(id=>({id:`w${id}`,nl:`woord${id}`,sourceCardId:id})));
 const state=taught(Object.fromEntries(ids.map(id=>[`w${id}`,yesterday])));
 let cards=[...Array.from({length:8},(_,i)=>card(i+1,`deck${i+1}`)),...ids.map(id=>card(Number(id),`woord${id}`))];
 // The first device introduces two course cards, then stops.
 for(const id of [11,12]){const index=cards.findIndex(c=>c.id===id);cards[index]={...cards[index],...applyFlashcardRating(cards[index],'good',{today,nowIso:`${today}T08:00:00Z`}).card};}
 assert.equal(cards.filter(c=>c.first_seen===today).length,2);
 const p=courseNewCardPriority({content,cards,today,learnerState:state});
 assert.equal(p.share,1);
 assert.deepEqual(p.cardIds,['13','14','15']);
 const allowance=remainingNewCards({configuredMax:5,introducedToday:2});
 assert.equal(allowance,3);
 const fresh=newIds(buildFlashcardQueue(cards,{today,newLimit:allowance,priorityNewIds:p.cardIds,priorityLimit:p.share,random:keepOrder}));
 assert.deepEqual(fresh,['1','13','2']);
});

test('empty local progress falls back to card-ID order, and priority returns once progress is recovered',()=>{
 const content=course([{id:'a',nl:'acht',sourceCardId:'8'}]);
 const cards=Array.from({length:8},(_,i)=>card(i+1,i===7?'acht':`w${i}`));
 const empty=courseNewCardPriority({content,cards,today,learnerState:{}});
 assert.deepEqual(empty.cardIds,[]);
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:2,priorityNewIds:empty.cardIds,priorityLimit:empty.share,random:keepOrder})),['1','2']);
 assert.deepEqual(courseNewCardPriority({content:null,cards,today,learnerState:taught({a:yesterday})}).cardIds,[]);
 const recovered=courseNewCardPriority({content,cards,today,learnerState:taught({a:yesterday})});
 assert.deepEqual(newIds(buildFlashcardQueue(cards,{today,newLimit:2,priorityNewIds:recovered.cardIds,priorityLimit:recovered.share,random:keepOrder})),['1','8']);
});

test('the switch turns course priority off',()=>{
 const content=course([{id:'a',nl:'een',sourceCardId:'1'}]);
 assert.deepEqual(courseNewCardPriority({content,cards:[card(1,'een')],today,learnerState:taught({a:yesterday}),enabled:false}).cardIds,[]);
});

test('the Flashcards screen passes the course priority into the same allowance and writes nothing new',()=>{
 const ui=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
 assert.match(ui,/buildFlashcardQueue\(loaded\.cards,\{today:c\.today,newLimit:c\.dueNew,priorityNewIds:p\.cardIds,priorityLimit:p\.share\}\)/);
 assert.match(ui,/within the same daily limit/);
 assert.match(ui,/No cards are created automatically/);
 assert.match(ui,/0 course words are ready for Flashcards/);
 assert.match(ui,/Course words could not be loaded, so today’s new cards use the usual order/);
 const intake=readFileSync(new URL('../src/engine/course-flashcard-intake.js',import.meta.url),'utf8');
 assert.doesNotMatch(intake,/fetch\(|localStorage|setItem|POST|PATCH/);
 assert.match(readFileSync(new URL('../sw.js',import.meta.url),'utf8'),/course-flashcard-intake\.js/);
});
