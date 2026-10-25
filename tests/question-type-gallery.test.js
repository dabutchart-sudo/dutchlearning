import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {kinds} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {galleryExamples,QUESTION_TYPE_TITLES} from '../src/engine/question-type-gallery.js';

test('the gallery has one labelled example of each daily question type',()=>{
 const examples=galleryExamples();
 assert.deepEqual(examples.map(example=>example.kind),kinds);
 assert.equal(new Set(examples.map(example=>example.kind)).size,kinds.length);
 for(const example of examples){
  assert.equal(example.title,QUESTION_TYPE_TITLES[example.kind]);
  assert.equal(example.question.kind,example.kind);
  assert.equal(example.item.nl,'Ik drink koffie.');
 }
});

test('each example accepts its own model answer',()=>{
 for(const example of galleryExamples()){
  const result=assess(example.question,example.question.answer,{assisted:false,knownWords:new Set()});
  assert.equal(result.grammar,true,example.kind);
 }
});

test('the example screen is development-only and does not touch learning progress',()=>{
 const ui=readFileSync(new URL('../src/ui/question-type-gallery.js',import.meta.url),'utf8');
 const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(ui,/classifyOrigin/);
 assert.match(ui,/!=='production'/);
 assert.match(ui,/Question type:/);
 assert.match(ui,/data-question-type/);
 assert.match(ui,/do not change today’s 20/);
 assert.doesNotMatch(ui,/localStorage|createRepository|STORAGE_KEY|\bsubmit\b/);
 assert.match(index,/question-type-gallery\.js/);
 assert.match(sw,/src\/engine\/question-type-gallery\.js/);
 assert.match(sw,/src\/ui\/question-type-gallery\.js/);
});

test('speaking preview uses an explicit no-cost simulation rather than a second speech service',()=>{
 const ui=readFileSync(new URL('../src/ui/question-type-gallery.js',import.meta.url),'utf8');
 assert.match(ui,/No-cost simulation/);
 assert.match(ui,/Use sample transcript/);
 assert.match(ui,/not speaking evidence/);
 assert.doesNotMatch(ui,/SpeechRecognition|webkitSpeechRecognition|getUserMedia|MediaRecorder|fetch\(/);
});

test('gallery shows one selected question and resets temporary answers on switching',()=>{
 const ui=readFileSync(new URL('../src/ui/question-type-gallery.js',import.meta.url),'utf8');
 assert.match(ui,/select id="gallery-kind"/);
 assert.match(ui,/select.onchange=show/);
 assert.match(ui,/data-gallery-stage/);
 assert.match(ui,/example.raw='';example.selection=\[\];example.assisted=false/);
 const css=readFileSync(new URL('../src/ui/question-type-gallery.css',import.meta.url),'utf8');
 assert.match(css,/position:sticky/);
});
