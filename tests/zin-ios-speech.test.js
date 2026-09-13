import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
const speechUrl=new URL('../src/ui/speech.js',import.meta.url);

test('Zin naming is used for the visible app and installed PWA',()=>{
  assert.match(index,/<h1>Zin<\/h1>/);
  assert.match(index,/<title>Zin · V5\.1\.105<\/title>/);
  assert.match(index,/apple-mobile-web-app-title" content="Zin"/);
  assert.equal(manifest.name,'Zin');
  assert.equal(manifest.short_name,'Zin');
});

test('iOS can use the system Dutch voice when getVoices does not enumerate one',async()=>{
  const spoken=[];
  class Utterance{constructor(text){this.text=text;this.voice=null;this.lang='';this.rate=1;}}
  globalThis.SpeechSynthesisUtterance=Utterance;
  globalThis.speechSynthesis={getVoices:()=>[],cancel(){},speak(u){spoken.push(u);}};
  const speech=await import(`${speechUrl.href}?fallback=${Date.now()}`);
  const voice=speech.dutchVoice();
  assert.equal(voice.lang,'nl-NL');
  assert.equal(voice.__systemFallback,true);
  assert.equal(speech.speak('Goedemorgen'),true);
  assert.equal(spoken.length,1);
  assert.equal(spoken[0].lang,'nl-NL');
  assert.equal(spoken[0].voice,null);
  delete globalThis.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
});
