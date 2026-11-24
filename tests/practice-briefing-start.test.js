import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {markWordsTaught} from '../src/engine/learner.js';
import {sessionVocabulary,rememberBriefing,briefingDone} from '../src/engine/session-briefing.js';

const source=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
const interceptSource=source.slice(source.indexOf('function interceptClicks('),source.indexOf('async function init('));
const today='2026-11-24';
function intercept(selector,{needed=true,shown=false}={}){
 const state={daily:{date:today,count:0},progress:{F5:{lessonAcknowledged:selector!=='#learned'}},words:{},attempts:[]};
 let listener,continuation,clicked=0,stopped=0,saved=0;
 const control={textContent:selector==='#learned'?'Got it — let’s practise':'Start practice',click:()=>clicked++};
 const context={document:{addEventListener:(_name,fn)=>listener=fn,querySelector:()=>assert.fail('Continuation must not search for a newly rendered start button')},
  requestAnimationFrame:()=>assert.fail('Continuation must not depend on animation-frame timing'),
  inSandbox:()=>false,currentState:()=>state,activeConcept:()=>'F5',dayKey:()=>today,content:{},
  briefingNeeded:()=>needed,briefingDone:()=>shown,dailyProofOffer:()=>null,localStorage:{},
  repo:{save:()=>saved++},teachConcept:s=>{s.progress.F5.lessonAcknowledged=true;},
  showBriefing:(_id,options)=>continuation=options?.onContinue};
 vm.createContext(context);vm.runInContext(interceptSource,context);context.interceptClicks();
 listener({target:{closest:query=>query.split(',').includes(selector)?control:null},preventDefault:()=>stopped++,stopImmediatePropagation:()=>stopped++});
 return {state,continue:()=>continuation(),get clicked(){return clicked;},get stopped(){return stopped;},get saved(){return saved;}};
}

for(const [label,selector] of [['Course start','[data-course-start]'],['topic start','#start-course'],['legacy start','#start'],['lesson acknowledgement','#learned'],['explicit practice after a proof offer','#gate-practice']]){
 test(`${label} continues its original action after briefing without waiting for a redraw`,()=>{
  const f=intercept(selector);
  assert.equal(f.stopped,2);assert.equal(f.clicked,0);assert.equal(f.state.daily.count,0);
  f.continue();
  assert.equal(f.clicked,1);assert.equal(f.state.daily.count,0);
  if(selector==='#learned'){assert.equal(f.state.progress.F5.lessonAcknowledged,true);assert.equal(f.saved,1);}
 });
}

test('briefing records taught words and the daily marker before continuing, without consuming an answer',()=>{
 const state={daily:{date:today,count:0},words:{},attempts:[{id:'saved-attempt'}]},map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const content={sentences:[{concept:'F5',pool:'practice',vocabulary:[{id:'word:hebben',nl:'hebben',en:'to have'}]}]};
 let handler,saves=0,continued=0;const host={innerHTML:''};
 const context={content,sessionVocabulary,dayKey:()=>today,vocabularyHTML:()=>'',document:{body:{classList:{add:()=>{}}},querySelector:()=>null,getElementById:id=>id==='content'?host:{addEventListener:(_event,fn)=>handler=fn}},
  repo:{load:()=>state,save:()=>saves++},markWordsTaught,rememberBriefing,localStorage:storage};
 vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf('function showBriefing('),source.indexOf('function currentState(')),context);
 context.showBriefing('F5',{onContinue:()=>{assert.equal(saves,1);assert.equal(briefingDone(storage,today,'F5'),true);assert.equal(state.words['word:hebben'].taughtAt,today);continued++;}});
 assert.equal(state.daily.count,0);assert.equal(continued,0);
 handler();assert.equal(continued,1);assert.equal(state.daily.count,0);assert.deepEqual(state.attempts,[{id:'saved-attempt'}]);
});

test('an already acknowledged briefing does not intercept the next start or lesson action',()=>{
 const start=intercept('[data-course-start]',{needed:false});assert.equal(start.stopped,0);
 const lesson=intercept('#learned',{shown:true});assert.equal(lesson.stopped,0);assert.equal(lesson.saved,0);
});

test('briefing save and continuation failures become visible and can be retried',async()=>{
 for(const stage of ['progress','marker','continuation']){
  let handler,failed=true,continued=0;
  const errorBox={hidden:true,textContent:''},state={daily:{count:0},words:{}};
  const fail=()=>{throw Object.assign(new Error('Storage full'),{name:'QuotaExceededError'});};
  const context={content:{},sessionVocabulary:()=>[],dayKey:()=>today,vocabularyHTML:()=>'',
   document:{body:{classList:{add:()=>{}}},querySelector:()=>null,getElementById:id=>id==='content'?{innerHTML:''}:id==='session-briefing-error'?errorBox:{addEventListener:(_event,fn)=>handler=fn}},
   repo:{load:()=>state,save:()=>{if(stage==='progress'&&failed)fail();}},markWordsTaught:()=>{},
   rememberBriefing:()=>{if(stage==='marker'&&failed)fail();},localStorage:{}};
  vm.createContext(context);vm.runInContext(source.slice(source.indexOf('function showBriefing('),source.indexOf('function currentState(')),context);
  context.showBriefing('F5',{onContinue:async()=>{if(stage==='continuation'&&failed)throw Error('Could not open question');continued++;}});
  await handler();assert.equal(continued,0);assert.equal(errorBox.hidden,false);
  assert.match(errorBox.textContent,stage==='continuation'?/Could not open question/:/out of storage/);
  assert.equal(state.daily.count,0);
  failed=false;await handler();assert.equal(continued,1);assert.equal(errorBox.hidden,true);assert.equal(errorBox.textContent,'');
 }
});

test('Course start reports an asynchronous save failure instead of leaving an unhandled rejection',async()=>{
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8'),button={},messages=[];
 const line=app.split('\n').find(line=>line.includes("el.querySelectorAll('[data-course-start]')"));
 const context={el:{querySelectorAll:()=>[button]},beginDaily:async()=>{throw Error('Storage full');},notify:message=>messages.push(message)};
 vm.createContext(context);vm.runInContext(line,context);await button.onclick();assert.deepEqual(messages,['Storage full']);
});
