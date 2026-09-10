// Generated from the complete asset set. Cache is scoped to this GitHub Pages path.
// Migration lineage: v5.1.5 → v5.1.6 → v5.1.7 → v5.1.8 → v5.1.9 → v5.1.10 → v5.1.11 → v5.1.12 → v5.1.13 → v5.1.14 → v5.1.15 → v5.1.16 → v5.1.17 → v5.1.18 → current v5.1.19.
const CACHE="dutch-v5.1.19-20260910"+'-'+self.registration.scope;
const ASSETS=["./","./index.html","./manifest.webmanifest","./src/content/foundation-a1.json","./src/content/packs.json","./src/content/registry.js","./src/content/vocabulary.json","./src/engine/exercises.js","./src/engine/flashcards.js","./src/engine/flashcard-session.js","./src/engine/integrations.js","./src/engine/learner.js","./src/engine/persistence.js","./src/engine/scheduler.js","./src/engine/scoring.js","./src/engine/sentence-bank.js","./src/engine/util.js","./src/engine/word-recall.js","./src/ui/peek.js","./src/ui/app.js","./src/ui/flashcards-preview.js","./src/ui/flashcard-completion-sync.js","./src/ui/flashcards-preview.css","./src/ui/sentence-bank-client.js","./src/ui/sentence-bank-ui.js","./src/ui/sentence-bank-ui.css","./src/ui/speech.js","./src/ui/styles.css","./src/ui/v51.css","./src/ui/v51.js","./icons/icon-192.png","./icons/icon-512.png"];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('dutch-v5')&&k.endsWith(self.registration.scope)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||!event.request.url.startsWith(self.registration.scope))return;
 const url=new URL(event.request.url),freshCode=['script','style','document'].includes(event.request.destination)||url.pathname.endsWith('.js')||url.pathname.endsWith('.css')||url.pathname.endsWith('/');
 if(freshCode){
  event.respondWith(caches.open(CACHE).then(async cache=>{
   try{const response=await fetch(event.request,{cache:'no-store'});if(response&&response.ok)cache.put(event.request,response.clone());return response;}
   catch(error){const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}
  }));
  return;
 }
 event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(event.request,{ignoreSearch:true});if(hit)return hit;try{return await fetch(event.request)}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}}));
});
