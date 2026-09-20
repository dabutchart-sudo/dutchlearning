import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flashcardsChromeLabel,flashcardsChromeState,learningChromeFromStorage,learningChromeLabel} from '../src/ui/daily-chrome.js';
import {STORAGE_KEY} from '../src/engine/persistence.js';
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');

function memoryStorage(entries={}){
 const data={...entries};
 return {
  get length(){return Object.keys(data).length;},
  key(i){return Object.keys(data)[i]??null;},
  getItem(key){return Object.prototype.hasOwnProperty.call(data,key)?data[key]:null;},
  setItem(key,value){data[key]=String(value);}
 };
}

test('Learning chrome shows the daily count, a ready test, or a finished day',()=>{
 assert.equal(learningChromeLabel({count:0}),'Learning 0 / 20');
 assert.equal(learningChromeLabel({count:6}),'Learning 6 / 20');
 assert.equal(learningChromeLabel({count:6,testReady:true}),'Learning · test ready');
 assert.equal(learningChromeLabel({count:20,done:true}),'Learning done');
});

test('Flashcards chrome is ready until today’s completion flag is set',()=>{
 assert.equal(flashcardsChromeLabel('ready'),'Flashcards ready');
 assert.equal(flashcardsChromeLabel('done'),'Flashcards done');
 assert.equal(flashcardsChromeState(memoryStorage(),'2026-09-20'),'ready');
 assert.equal(flashcardsChromeState(memoryStorage({'dutch_flashcards_completed_v1:https://example.test:2026-09-20':'complete'}),'2026-09-20'),'done');
});

test('Learning chrome can read the saved daily count',()=>{
 const storage=memoryStorage({[STORAGE_KEY]:JSON.stringify({daily:{date:'2026-09-20',count:7}})});
 assert.deepEqual(learningChromeFromStorage(storage),{count:7,done:false,extra:false});
});

test('the header chrome module is cached for offline use',()=>{
 assert.match(sw,/daily-chrome\.js/);
});
