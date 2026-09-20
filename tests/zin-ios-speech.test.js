import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));const speechUrl=new URL('../src/ui/speech.js',import.meta.url);const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');const server=readFileSync(new URL('../preview/serve-dev.py',import.meta.url),'utf8');
function mockSynth(spoken,extra={}){
 class Utterance{constructor(text){this.text=text;this.voice=null;this.lang='';this.rate=1;this.volume=1;}}
 globalThis.SpeechSynthesisUtterance=Utterance;
 globalThis.speechSynthesis={speaking:false,pending:false,paused:false,getVoices:()=>[],cancel(){},resume(){},speak(u){spoken.push(u);},...extra};
}
async function nextTurn(){await new Promise(resolve=>setTimeout(resolve,0));}

test('Zin naming is used for the visible app and installed PWA',()=>{assert.match(index,/<h1>Zin<\/h1>/);assert.match(index,/<title>Zin · V5\.1\.\d+<\/title>/);assert.match(index,/apple-mobile-web-app-title" content="Zin"/);assert.equal(manifest.name,'Zin');assert.equal(manifest.short_name,'Zin');});

test('iOS can use the system Dutch voice when getVoices does not enumerate one',async()=>{const spoken=[];mockSynth(spoken);const speech=await import(`${speechUrl.href}?fallback=${Date.now()}`);const voice=speech.dutchVoice();assert.equal(voice.lang,'nl-NL');assert.equal(voice.__systemFallback,true);assert.equal(speech.speak('Goedemorgen'),true);await nextTurn();assert.equal(spoken.length,1);assert.equal(spoken[0].lang,'nl-NL');assert.equal(spoken[0].voice,null);delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;});

test('the first Listen does not cancel, so iOS can start audio in the same tap',async()=>{let cancelled=0;const spoken=[];mockSynth(spoken,{cancel(){cancelled++;}});const speech=await import(`${speechUrl.href}?first=${Date.now()}`);assert.equal(speech.speak('Hallo'),true);await nextTurn();assert.equal(cancelled,0);assert.equal(spoken.length,1);assert.equal(spoken[0].text,'Hallo');delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;});

test('a later Listen waits after cancel so iOS does not drop the new utterance',async()=>{let cancelled=0;const spoken=[];mockSynth(spoken,{speaking:true,cancel(){cancelled++;this.speaking=false;}});const speech=await import(`${speechUrl.href}?later=${Date.now()}`);assert.equal(speech.speak('Dag'),true);await nextTurn();assert.equal(cancelled,1);assert.equal(spoken.length,0);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(spoken.length,1);assert.equal(spoken[0].text,'Dag');delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;});

test('production Listen unlocks on a separate element then plays fetched OpenAI audio',async()=>{const played=[];class FakeAudio{constructor(){this.src='';this.volume=1;this.muted=false;this.playsInline=false;this.preload='';}setAttribute(){}pause(){}play(){played.push(this.src);return Promise.resolve();}}globalThis.Audio=FakeAudio;globalThis.URL={createObjectURL:()=>'blob:listen',revokeObjectURL(){}};globalThis.location={hostname:'dabutchart-sudo.github.io',href:'https://dabutchart-sudo.github.io/dutchlearning'};globalThis.fetch=async(url,opts)=>{if(String(url).includes('constants.js'))return {ok:true,text:async()=>`export const SUPABASE_ANON_KEY='anon';`};assert.match(String(url),/functions\/v1\/listen-tts/);assert.equal(opts.method,'POST');assert.equal(JSON.parse(opts.body).text,'Ik drink koffie.');return {ok:true,blob:async()=>new Blob(['mp3'],{type:'audio/mpeg'})};};const spoken=[];mockSynth(spoken);const speech=await import(`${speechUrl.href}?prod=${Date.now()}`);assert.equal(speech.canUseProductionListen(),true);assert.equal(speech.speak('Ik drink koffie.'),true);assert.ok(played.some(src=>String(src).startsWith('data:audio/wav')));await nextTurn();await nextTurn();assert.ok(played.includes('blob:listen'));assert.equal(spoken.length,0);delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;delete globalThis.Audio;delete globalThis.fetch;delete globalThis.location;});

test('device Listen ignores canceled speech events so iPhone does not show a false error',async()=>{const errors=[];const spoken=[];mockSynth(spoken);const speech=await import(`${speechUrl.href}?canceled=${Date.now()}`);speech.speak('Hallo',message=>errors.push(message));await nextTurn();spoken[0].onerror({error:'canceled'});assert.deepEqual(errors,[]);spoken[0].onerror({error:'synthesis-failed'});assert.match(errors[0]||'',/speech is enabled/);delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;});

test('LAN Listen starts OpenAI audio in the same tap',async()=>{const played=[];class FakeAudio{constructor(){this.muted=false;this.src='';this.playsInline=false;this.volume=1;this.preload='';}setAttribute(){}pause(){}play(){played.push(this.src);return Promise.resolve();}}globalThis.Audio=FakeAudio;globalThis.location={hostname:'192.168.0.41'};const spoken=[];mockSynth(spoken);const speech=await import(`${speechUrl.href}?lan=${Date.now()}`);assert.equal(speech.canUseServerListen(),true);assert.match(speech.listenAudioUrl('Ik drink koffie.'),/\/listen\/tts\?text=/);assert.equal(speech.speak('Ik drink koffie.'),true);assert.match(played[0]||'',/\/listen\/tts\?text=/);assert.match(decodeURIComponent(played[0]||''),/Ik drink koffie/);assert.equal(spoken.length,0);delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;delete globalThis.Audio;delete globalThis.location;});

test('LAN Listen shows the server error when OpenAI rejects the key',async()=>{const errors=[];class FakeAudio{constructor(){this.muted=false;this.src='';this.playsInline=false;this.volume=1;this.preload='';}setAttribute(){}pause(){}play(){return Promise.reject(Error('NotSupportedError'));}}globalThis.Audio=FakeAudio;globalThis.location={hostname:'192.168.0.41'};globalThis.fetch=async url=>{assert.equal(url,'/listen/status');return {ok:true,json:async()=>({openai:true,error:'OpenAI rejected the API key.'})};};const spoken=[];mockSynth(spoken);const speech=await import(`${speechUrl.href}?rejected=${Date.now()}`);speech.speak('Hallo',message=>errors.push(message));await nextTurn();assert.match(errors[0]||'',/rejected the API key/);assert.equal(spoken.length,0);delete globalThis.speechSynthesis;delete globalThis.SpeechSynthesisUtterance;delete globalThis.fetch;delete globalThis.Audio;delete globalThis.location;});

test('the LAN development server keeps the OpenAI key off the phone and disables the service worker',()=>{
 assert.match(server,/8765/);
 assert.match(server,/0\.0\.0\.0/);
 assert.match(server,/\/listen\/tts/);
 assert.match(server,/parse_qs\(parts.query\)/);
 assert.match(server,/BrokenPipeError/);
 assert.match(server,/last_listen_error/);
 assert.match(server,/OpenAI listen audio/);
 assert.match(server,/Service workers are disabled/);
 assert.match(server,/api.openai.com/);
 assert.doesNotMatch(server,/OPENAI_API_KEY.{0,20}print|console/);
 assert.match(app,/is-development/);
 assert.match(app,/serviceWorker\.getRegistrations/);
 assert.doesNotMatch(app,/sk-|Authorization|Bearer /);
});

const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const listenFn=readFileSync(new URL('../supabase/functions/listen-tts/index.ts',import.meta.url),'utf8');
const listenConfig=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8');
test('production service worker proxies Listen to the OpenAI function without caching it',()=>{
 assert.match(sw,/pathname\.endsWith\('\/listen\/tts'\)/);
 assert.match(sw,/functions\/v1\/listen-tts/);
 assert.match(sw,/flashcards\/constants\.js/);
 assert.match(sw,/Cache-Control':'no-store/);
 assert.doesNotMatch(sw,/OPENAI_API_KEY|sk-/);
 assert.match(listenFn,/api.openai.com\/v1\/audio\/speech/);
 assert.match(listenFn,/tts-1/);
 assert.match(listenConfig,/verify_jwt = false/);
});
