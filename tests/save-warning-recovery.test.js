import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const preview=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
const sync=readFileSync(new URL('../src/ui/v51.js',import.meta.url),'utf8');

test('Flashcard failure, successful retry, and later failure show current save status',async()=>{
 const message={innerHTML:''},card={id:1},statuses=[];
 let failure='Connection lost',calls=0,newerWarning=false;
 const context={message,session:{busy:false,flipped:true,day:'2026-11-04',queue:[card],completed:0},loaded:{supabaseUrl:'test',key:'test',cards:[card],history:[]},document:{querySelectorAll:()=>[]},current:()=>card,applyFlashcardRating:()=>({card:{id:1},history:{},requeue:false}),flashcardsStatus:(kind)=>statuses.push(kind),esc:x=>x,renderCard:()=>{},request:async()=>{calls++;if(failure)throw Error(failure);if(newerWarning)message.innerHTML='A separate audio error';}};
 const save=vm.runInNewContext(`(${preview.slice(preview.indexOf('async function saveRating('),preview.indexOf('async function openPreview('))})`,context);
 await save('good');
 assert.match(message.innerHTML,/Connection lost/);
 assert.equal(context.session.completed,0);
 failure=null;calls=0;
 await save('good');
 assert.equal(calls,2);
 assert.equal(message.innerHTML,'');
 assert.equal(context.session.completed,1);
 context.session.flipped=true;failure='Different save failure';
 await save('good');
 assert.match(message.innerHTML,/Different save failure/);
 assert.equal(statuses.at(-1),'error');
 context.session.flipped=true;failure=null;newerWarning=true;
 await save('good');
 assert.equal(message.innerHTML,'A separate audio error');
});

test('automatic Learning sync replaces a previous manual sync failure only after success',async()=>{
 const msg={textContent:''};let failure=true;
 const context={syncing:false,lastRevision:0,supabase:{auth:{getUser:async()=>{if(failure)throw Error('No connection');return {data:{user:{id:1}}};}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null})})})})},setStatus:()=>{},localState:()=>({revision:1}),course:async()=>({}),applyLearningSync:()=>({action:'none'}),pullAttempts:async()=>[],mergeRemoteAttempts:()=>({added:0}),attemptMergeBase:x=>x,document:{querySelector:()=>msg},navigator:{onLine:true},console:{warn:()=>{}},renderSyncPanel:()=>{}};
 const run=vm.runInNewContext(`(${sync.slice(sync.indexOf('async function syncNow('),sync.indexOf('\nfunction enhance('))})`,context);
 await run(true);
 assert.match(msg.textContent,/Sync failed: No connection/);
 failure=false;await run(false);
 assert.equal(msg.textContent,'Synced just now.');
 failure=true;await run(false);
 assert.match(msg.textContent,/Sync failed: No connection/);
});
