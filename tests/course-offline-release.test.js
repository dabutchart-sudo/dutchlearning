import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

test('release worker installs real assets, preserves other scopes and serves Course offline',async()=>{
 const root=new URL('../',import.meta.url),scope='https://example.test/dutchlearning/';
 const source=readFileSync(new URL('sw.js',root),'utf8');
 const version=JSON.parse(readFileSync(new URL('package.json',root))).version;
 const listeners={},stored=new Map(),deleted=[];
 const old=`dutch-v5.1.118-${scope}`,other='dutch-v5.1.118-https://example.test/other/';
 let current;
 const cache={async addAll(paths){for(const path of paths){assert.ok(existsSync(new URL(path,root)),path);stored.set(new URL(path,scope).href,{asset:path});}},async match(request){const url=new URL(typeof request==='string'?request:request.url,scope);url.search='';return stored.get(url.href);},async put(){}};
 vm.runInNewContext(source,{URL,self:{registration:{scope},skipWaiting(){},clients:{async claim(){}},addEventListener(name,fn){listeners[name]=fn;}},caches:{async open(name){current=name;return cache;},async keys(){return [old,other,current];},async delete(name){deleted.push(name);}},async fetch(){throw Error('offline');}});
 let pending;listeners.install({waitUntil(p){pending=p;}});await pending;
 assert.ok(current.includes(`v${version}-`));
 listeners.activate({waitUntil(p){pending=p;}});await pending;
 assert.deepEqual(deleted,[old]);
 for(const path of ['src/engine/course-progress.js','src/ui/course-overview.js','src/ui/course-overview.css','index.html']){
  let response;listeners.fetch({request:{method:'GET',url:`${scope}${path}?v=${version}`,destination:path.endsWith('.css')?'style':'script'},respondWith(p){response=p;}});
  assert.equal((await response).asset,`./${path}`);
 }
 const html=readFileSync(new URL('index.html',root),'utf8');
 assert.ok(html.includes(`V${version}`));assert.ok(html.includes(`course-overview.css?v=${version}`));
});
