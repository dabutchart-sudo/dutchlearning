import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allowedSpeechText,listeningOptions,SAMPLE,scoreListening,scoreSpeaking} from '../src/engine/listen-speak-preview.js';

test('sample listening item is a known A1 coffee sentence',()=>{
 assert.equal(SAMPLE.nl,'Ik drink koffie.');
 assert.equal(SAMPLE.en,'I drink coffee.');
});

test('listening options include the meaning and the distractors once each',()=>{
 const options=listeningOptions(SAMPLE,7);
 assert.equal(options.length,3);
 assert.deepEqual([...options].sort(),[SAMPLE.en,...SAMPLE.distractors].sort());
});

test('listening scores only the English meaning',()=>{
 assert.equal(scoreListening('I drink coffee.').correct,true);
 assert.equal(scoreListening('I drink tea.').correct,false);
});

test('speaking accepts the Dutch sentence after punctuation and case changes',()=>{
 assert.equal(scoreSpeaking('ik drink koffie').correct,true);
 assert.equal(scoreSpeaking('Ik drink thee.').correct,false);
 assert.equal(scoreSpeaking('').empty,true);
 assert.equal(scoreSpeaking('Ik drink koffi.').near,true);
});

test('the preview proxy may only request audio for the sample Dutch sentence',()=>{
 assert.equal(allowedSpeechText('Ik drink koffie.'),true);
 assert.equal(allowedSpeechText('Wat kost dat?'),false);
});

test('isolated preview keeps service workers and production study out',()=>{
 const server=readFileSync(new URL('../preview/serve-listen-speak.py',import.meta.url),'utf8');
 const html=readFileSync(new URL('../preview/listen-speak.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../preview/listen-speak.js',import.meta.url),'utf8');
 assert.match(server,/19086/);
 assert.match(server,/Service workers are disabled/);
 assert.doesNotMatch(server,/OPENAI_API_KEY.{0,20}print|console/);
 assert.match(server,/api.openai.com/);
 assert.match(server,/cached_tts|tts_audio/);
 assert.match(server,/prefetch_tts/);
 assert.match(server,/gpt-4o-mini-transcribe/);
 assert.match(js,/ensureDutchAudio/);
 assert.match(js,/Preparing audio|Transcribing/);
 assert.match(html,/Listen and speak test area/);
 assert.doesNotMatch(html,/sw\.js/);
 assert.doesNotMatch(js,/sk-|Authorization|Bearer /);
 assert.match(js,/\/preview\/tts/);
 assert.match(js,/\/preview\/stt/);
 assert.match(html,/Skip speaking and stay with listening/);
 assert.match(js,/Skip speaking — type instead/);
});
