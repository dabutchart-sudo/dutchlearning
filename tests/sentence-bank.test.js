import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mergeSentenceBank,sentenceBankNeedsRefresh,chooseSentence,sentenceBankRecord,resetShownReviewSentence,shownReviewSentence,sentenceUsesCardWord} from '../src/engine/sentence-bank.js';
import {writeSentenceBankCache} from '../src/engine/sentence-bank-cache.js';
const card={id:42,dutch:'schrijven',english:'to write',dutch_sentence:'Ik schrijf elke dag.',english_sentence:'I write every day.'};
test('current card example is always retained as a fallback',()=>{const bank=mergeSentenceBank(card,[],[]);assert.equal(bank.length,1);assert.equal(bank[0].nl,'Ik schrijf elke dag.');assert.equal(bank[0].source,'card-current');});
test('stored and generated sentence pairs are deduplicated',()=>{const bank=mergeSentenceBank(card,[{nl:'Ik schrijf een brief.',en:'I write a letter.'}],[{nl:'Ik schrijf een brief.',en:'I write a letter.'},{nl:'Wij schrijven samen.',en:'We write together.'}]);assert.equal(bank.length,3);});
test('sentence bank asks for generation when fewer than five examples exist',()=>{assert.equal(sentenceBankNeedsRefresh([{id:'1'}]),true);assert.equal(sentenceBankNeedsRefresh(Array.from({length:5},(_,i)=>({id:String(i)}))),false);});
test('rotation avoids recently shown sentence IDs when alternatives exist',()=>{const bank=[{id:'a',nl:'A',en:'A'},{id:'b',nl:'B',en:'B'}],chosen=chooseSentence(bank,{recentIds:['a'],random:()=>0});assert.equal(chosen.id,'b');});
test('sentence bank record is capped and marks generated updates',()=>{const generated=Array.from({length:15},(_,i)=>({id:`g${i}`,nl:`Zin ${i}`,en:`Sentence ${i}`})),r=sentenceBankRecord(card,[],generated,new Date('2026-09-10T18:00:00Z'));assert.equal(r.sentences.length,10);assert.equal(r.updatedAt,'2026-09-10T18:00:00.000Z');});
test('a varied example is chosen once and stays through the flip redraw',()=>{
 resetShownReviewSentence();
 const storage={map:new Map(),get length(){return this.map.size;},key(i){return [...this.map.keys()][i]??null;},getItem(key){return this.map.has(key)?this.map.get(key):null;},setItem(key,value){this.map.set(key,String(value));}};
 writeSentenceBankCache(storage,'https://sentences.example',{'42':{sentences:[{id:'soon',nl:'Tot straks.',en:'See you soon.'},{id:'later',nl:'Ik kom straks.',en:'I am coming soon.'}],updatedAt:'2026-10-18T12:00:00Z'}});
 const straks={...card,dutch:'straks',english:'soon',dutch_sentence:'Doe het straks.',english_sentence:'Do it soon.'};
 const first=shownReviewSentence(straks,storage,{random:()=>.99});
 const flipped=shownReviewSentence(straks,storage,{random:()=>0});
 assert.equal(first.nl,'Ik kom straks.');
 assert.equal(first.en,'I am coming soon.');
 assert.deepEqual(flipped,first);
 assert.notEqual(first.nl,straks.dutch_sentence);
 const ui=readFileSync(new URL('../src/ui/sentence-bank-ui.js',import.meta.url),'utf8');
 assert.doesNotMatch(ui,/rotateReviewSentence/);
 assert.doesNotMatch(ui,/textContent=currentPair/);
});

test('sentence bank management UI is loaded and cached for offline use',()=>{const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(html,/sentence-bank-ui\.js/);assert.match(html,/sentence-bank-ui\.css/);assert.match(sw,/sentence-bank-client\.js/);assert.match(sw,/sentence-bank-ui\.js/);assert.match(sw,/sentence-bank-ui\.css/);});

const ophouden={id:1052,dutch:'ophouden',english:'to stop',partofword:'verb',dutch_sentence:'De regen moet snel ophouden, want we gaan fietsen.',english_sentence:'The rain must stop soon, because we are going cycling.'};
const memoryStorage=()=>({map:new Map(),get length(){return this.map.size;},key(i){return [...this.map.keys()][i]??null;},getItem(key){return this.map.get(key)??null;},setItem(key,value){this.map.set(key,String(value));}});

test('ophouden rejects the reported synonym and accepts separated and inflected forms',()=>{
 assert.equal(sentenceUsesCardWord(ophouden,'Zij vroeg hem om te stoppen met zingen.'),false);
 for(const sentence of ['De regen houdt op.','Hou nu op!','Zij vroeg hem om op te houden met zingen.','De regen is opgehouden.','Het lawaai hield eindelijk op.','Ik hoop dat de regen ophoudt.'])assert.equal(sentenceUsesCardWord(ophouden,sentence),true,sentence);
 for(const sentence of ['Ik houd van zingen.','Op straat zingen we. Hij houdt van muziek.','Wij stoppen de muziek.'])assert.equal(sentenceUsesCardWord(ophouden,sentence),false,sentence);
});

test('lexical guard covers whole words, articles, phrases and common verb forms',()=>{
 const cases=[
  [{dutch:'de fiets'},'Ik zie een fiets.',true],
  [{dutch:'fiets'},'Hij neemt de fietstas.',false],
  [{dutch:'straks',partofword:'adverb'},'Ik kom straks.',true],
  [{dutch:'tot straks'},'Tot straks!',true],
  [{dutch:'tot straks'},'Ik kom later.',false],
  [{dutch:'werken',partofword:'verb'},'Zij werkt thuis.',true],
  [{dutch:'maken',partofword:'verb'},'Hij maakt koffie.',true],
  [{dutch:'stoppen',partofword:'verb'},'Hij stopt nu.',true],
  [{dutch:'leven',partofword:'verb'},'Zij leeft hier.',true],
  [{dutch:'lezen',partofword:'verb'},'Hij las een boek.',true],
  [{dutch:'opstaan',partofword:'verb'},'Zij staat vroeg op.',true],
  [{dutch:'opbellen',partofword:'verb'},'Ik heb haar opgebeld.',true],
  [{dutch:''},'Een zin.',false]
 ];
 for(const [card,sentence,expected] of cases)assert.equal(sentenceUsesCardWord(card,sentence),expected,`${card.dutch}: ${sentence}`);
});

test('review excludes old cached synonyms without changing cache, readiness, or flip stability',()=>{
 resetShownReviewSentence();const storage=memoryStorage();
 const stored=[{nl:'De regen houdt op.',en:'The rain stops.'},{nl:'Zij vroeg hem om te stoppen met zingen.',en:'She asked him to stop singing.'}];
 writeSentenceBankCache(storage,'https://sentences.example',{'1052':{sentences:stored,updatedAt:'2026-11-26T21:00:00Z'}});
 const before=JSON.stringify([...storage.map]);
 const chosen=shownReviewSentence(ophouden,storage,{random:()=>.999});
 assert.equal(chosen.nl,'De regen houdt op.');
 assert.deepEqual(shownReviewSentence(ophouden,storage,{random:()=>0}),chosen);
 assert.equal(JSON.stringify([...storage.map]),before);
 assert.equal(mergeSentenceBank(ophouden,stored).length,3,'display filtering must not change generation coverage or cost');
});

test('only unusable generated examples fall back to the saved pair, without poisoning another card',()=>{
 resetShownReviewSentence();const storage=memoryStorage();
 const wrong={nl:'Zij vroeg hem om te stoppen met zingen.',en:'She asked him to stop singing.',source:'card-current'};
 writeSentenceBankCache(storage,'https://sentences.example',{'1052':{sentences:[wrong]}});
 assert.equal(shownReviewSentence(ophouden,storage,{random:()=>.999}).nl,ophouden.dutch_sentence);
 const noFallback={...ophouden,id:1053,dutch_sentence:null,english_sentence:null};
 writeSentenceBankCache(storage,'https://sentences.example',{'1053':{sentences:[wrong]}});
 assert.equal(shownReviewSentence(noFallback,storage),null);
 assert.equal(shownReviewSentence({...card,id:1054},storage).nl,card.dutch_sentence);
});
