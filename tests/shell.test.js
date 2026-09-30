import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {syncLabel} from '../src/ui/shell.js';

const state=(learning,flashcards)=>({learning:{kind:learning},flashcards:{kind:flashcards}});

test('sync summary never claims a full sync from a Learning result alone',()=>{
 assert.deepEqual(syncLabel(state('checking','not-checked')),{text:'Checking sync',tone:'working'});
 assert.deepEqual(syncLabel(state('synced','not-checked')),{text:'Learning synced · Flashcards not checked',tone:'working'});
 assert.deepEqual(syncLabel(state('synced','connected')),{text:'Learning and Flashcards connected',tone:'good'});
});

test('pending saves, local-only state, offline state and failures stay visible',()=>{
 assert.equal(syncLabel(state('synced','saving')).text,'Saving Flashcards');
 assert.equal(syncLabel(state('local','not-checked')).text,'Saved on this device');
 assert.equal(syncLabel(state('offline','offline')).tone,'offline');
 assert.equal(syncLabel(state('synced','error')).tone,'error');
});

test('the shell and its offline assets ship together',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/ui/shell.css',import.meta.url),'utf8');
 assert.match(html,/aria-label="Settings"/);
 assert.match(html,/id="sync-status"/);
 assert.match(html,/id="sync-details"/);
 assert.match(css,/\.tabs\{position:fixed/);
 assert.match(sw,/src\/ui\/shell\.css/);
 assert.match(sw,/src\/ui\/shell\.js/);
});
