import test from 'node:test';
import assert from 'node:assert/strict';
import {cachedSentenceEntry,preferredSentenceBankUrl,readSentenceBankCache,rememberSentenceBankUrl,sentenceBankCacheKey,sentenceBankCacheUrls,writeSentenceBankCache} from '../src/engine/sentence-bank-cache.js';

class MemoryStorage{
 constructor(seed={}){this.map=new Map(Object.entries(seed));}
 get length(){return this.map.size;}
 key(index){return [...this.map.keys()][index]??null;}
 getItem(key){return this.map.has(key)?this.map.get(key):null;}
 setItem(key,value){this.map.set(key,String(value));}
}

const entry=(word,updatedAt='2026-09-11T12:00:00Z')=>({sentences:[{id:`${word}-1`,nl:`Ik zie de ${word}.`,en:`I see the ${word}.`}],updatedAt});

test('discovers existing sentence-bank namespaces without loading remote configuration',()=>{
 const storage=new MemoryStorage({[sentenceBankCacheKey('https://one.example')]:JSON.stringify({'1':entry('deur')})});
 assert.deepEqual(sentenceBankCacheUrls(storage),['https://one.example']);
 assert.equal(preferredSentenceBankUrl(storage),'https://one.example');
 assert.equal(cachedSentenceEntry(storage,1).sentences.length,1);
});

test('remembered namespace is preferred when several caches exist',()=>{
 const storage=new MemoryStorage({
  [sentenceBankCacheKey('https://one.example')]:JSON.stringify({'1':entry('deur','2026-09-10T12:00:00Z')}),
  [sentenceBankCacheKey('https://two.example')]:JSON.stringify({'1':entry('deur','2026-09-11T12:00:00Z')})
 });
 rememberSentenceBankUrl(storage,'https://one.example');
 assert.equal(preferredSentenceBankUrl(storage),'https://one.example');
 // The freshest entry still wins, avoiding stale data when an older namespace is remembered.
 assert.equal(cachedSentenceEntry(storage,1).url,'https://two.example');
});

test('write stores cache and remembers its namespace',()=>{
 const storage=new MemoryStorage();
 writeSentenceBankCache(storage,'https://supabase.example',{'7':entry('fiets')});
 assert.equal(preferredSentenceBankUrl(storage),'https://supabase.example');
 assert.equal(readSentenceBankCache(storage,'https://supabase.example')['7'].sentences.length,1);
});

test('malformed cache data is ignored safely',()=>{
 const storage=new MemoryStorage({[sentenceBankCacheKey('https://bad.example')]:'not-json'});
 assert.deepEqual(readSentenceBankCache(storage,'https://bad.example'),{});
 assert.equal(cachedSentenceEntry(storage,1),null);
});
