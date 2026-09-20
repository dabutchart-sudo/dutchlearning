import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('service worker caches externally hosted images for offline reuse',()=>{
 assert.match(sw,/event\.request\.destination==='image'/);
 assert.match(sw,/cache\.match\(event\.request\)/);
 assert.match(sw,/response\.type==='opaque'/);
 assert.match(sw,/cache\.put\(event\.request,response\.clone\(\)\)/);
});

test('Listen audio is proxied and never stored in the offline cache',()=>{
 assert.match(sw,/pathname\.endsWith\('\/listen\/tts'\)/);
 assert.ok(sw.indexOf("pathname.endsWith('/listen/tts')")<sw.indexOf("event.request.destination==='image'"));
 assert.match(sw,/Cache-Control':'no-store/);
});

test('external image caching happens before same-scope request filtering',()=>{
 const imageBranch=sw.indexOf("event.request.destination==='image'");
 const scopeFilter=sw.indexOf('!event.request.url.startsWith(self.registration.scope)');
 assert.ok(imageBranch>=0);
 assert.ok(scopeFilter>=0);
 assert.ok(imageBranch<scopeFilter);
});
