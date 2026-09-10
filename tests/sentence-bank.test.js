import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSentenceBank,sentenceBankNeedsRefresh,chooseSentence,sentenceBankRecord} from '../src/engine/sentence-bank.js';
const card={id:42,dutch:'schrijven',english:'to write',dutch_sentence:'Ik schrijf elke dag.',english_sentence:'I write every day.'};
test('current card example is always retained as a fallback',()=>{const bank=mergeSentenceBank(card,[],[]);assert.equal(bank.length,1);assert.equal(bank[0].nl,'Ik schrijf elke dag.');assert.equal(bank[0].source,'card-current');});
test('stored and generated sentence pairs are deduplicated',()=>{const bank=mergeSentenceBank(card,[{nl:'Ik schrijf een brief.',en:'I write a letter.'}],[{nl:'Ik schrijf een brief.',en:'I write a letter.'},{nl:'Wij schrijven samen.',en:'We write together.'}]);assert.equal(bank.length,3);});
test('sentence bank asks for generation when fewer than five examples exist',()=>{assert.equal(sentenceBankNeedsRefresh([{id:'1'}]),true);assert.equal(sentenceBankNeedsRefresh(Array.from({length:5},(_,i)=>({id:String(i)}))),false);});
test('rotation avoids recently shown sentence IDs when alternatives exist',()=>{const bank=[{id:'a',nl:'A',en:'A'},{id:'b',nl:'B',en:'B'}],chosen=chooseSentence(bank,{recentIds:['a'],random:()=>0});assert.equal(chosen.id,'b');});
test('sentence bank record is capped and marks generated updates',()=>{const generated=Array.from({length:15},(_,i)=>({id:`g${i}`,nl:`Zin ${i}`,en:`Sentence ${i}`})),r=sentenceBankRecord(card,[],generated,new Date('2026-09-10T18:00:00Z'));assert.equal(r.sentences.length,10);assert.equal(r.updatedAt,'2026-09-10T18:00:00.000Z');});
