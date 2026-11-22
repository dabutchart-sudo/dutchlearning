import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/ui/v51.js',import.meta.url),'utf8');
const panelSource=source.slice(source.indexOf('async function renderSyncPanel('),source.indexOf('let courseContent='));
const syncSource=source.slice(source.indexOf('async function syncNow('),source.indexOf('\nfunction enhance('));
const missing={name:'AuthSessionMissingError',__isAuthError:true,message:'Auth session missing!'};
// Match the SDK's error discriminator; the browser check uses the real SDK export.
const isAuthSessionMissingError=e=>e?.__isAuthError===true&&e.name==='AuthSessionMissingError';
function fixture(result){
 const body={innerHTML:''},email={value:'  learner@example.test  '},message={textContent:''},signin={},sync={},out={};
 const calls={otp:[],remote:0,localWrites:0,statuses:[],warnings:[]};
 const nodes={'#v51-sync-body':body,'#sync-email':email,'#sync-message':message,'#sync-signin':signin,'#sync-now':sync,'#sync-out':out};
 const context={supabase:{auth:{getUser:async()=>result,signInWithOtp:async args=>{calls.otp.push(args);return {error:null};}},from:()=>{calls.remote++;throw Error('Unexpected remote access');}},
  isAuthSessionMissingError,escapeHtml:x=>String(x).replaceAll('<','&lt;'),document:{querySelector:id=>nodes[id]},
  location:{href:'https://example.test/dutchlearning/#settings'},navigator:{onLine:true},
  localStorage:{setItem:()=>calls.localWrites++},setStatus:(text,kind)=>calls.statuses.push({text,kind}),
  console:{warn:(...args)=>calls.warnings.push(args)},syncing:false,lastRevision:-1};
 vm.createContext(context);
 vm.runInContext(`${panelSource}\n${syncSource}`,context);
 return {context,body,signin,sync,message,calls};
}

test('a fresh device with a missing session sees the existing email form and can request its sign-in link',async()=>{
 const f=fixture({data:{user:null},error:missing});
 await f.context.renderSyncPanel();
 assert.match(f.body.innerHTML,/Email me a sign-in link/);
 assert.doesNotMatch(f.body.innerHTML,/Sign-in could not be checked/);
 assert.equal(f.calls.warnings.length,0);
 await f.signin.onclick();
 assert.equal(f.calls.otp.length,1);
 assert.equal(f.calls.otp[0].email,'learner@example.test');
 assert.equal(f.calls.otp[0].options.emailRedirectTo,'https://example.test/dutchlearning/');
 assert.equal(f.message.textContent,'Check your email for the sign-in link.');
 assert.equal(f.calls.remote,0);assert.equal(f.calls.localWrites,0);
});

test('automatic sync treats the missing session as signed out and never reads or overwrites progress',async()=>{
 const f=fixture({data:{user:null},error:missing});
 await f.context.syncNow();
 assert.equal(f.calls.statuses.at(-1).kind,'local');
 assert.match(f.calls.statuses.at(-1).text,/sign in to sync/);
 assert.equal(f.calls.remote,0);assert.equal(f.calls.localWrites,0);
 assert.equal(f.context.syncing,false);
});

test('a genuine connection or authentication error remains an error, with no progress writes',async()=>{
 for(const error of [{name:'AuthRetryableFetchError',message:'Connection unavailable'}, {name:'AuthApiError',message:'Invalid API key'}]){
  const f=fixture({data:{user:null},error});
  await f.context.renderSyncPanel();
  assert.match(f.body.innerHTML,/Sign-in could not be checked/);
  assert.doesNotMatch(f.body.innerHTML,/Email me a sign-in link/);
  await f.context.syncNow();
  assert.equal(f.calls.statuses.at(-1).kind,'error');
  assert.equal(f.calls.remote,0);assert.equal(f.calls.localWrites,0);
 }
});

test('a successful user check still shows Sync now, while a later sign-out returns to the email form',async()=>{
 const response={data:{user:{id:'example-user',email:'learner@example.test'}},error:null},f=fixture(response);
 await f.context.renderSyncPanel();
 assert.match(f.body.innerHTML,/Signed in as/);assert.match(f.body.innerHTML,/Sync now/);
 assert.equal(typeof f.sync.onclick,'function');
 response.data.user=null;
 await f.context.renderSyncPanel();
 assert.match(f.body.innerHTML,/Email me a sign-in link/);
 assert.doesNotMatch(f.body.innerHTML,/Signed in as/);
 assert.equal(f.calls.remote,0);assert.equal(f.calls.localWrites,0);
});
