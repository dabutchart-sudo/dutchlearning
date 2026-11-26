import test from 'node:test';
import assert from 'node:assert/strict';
import {installStudyViewport} from '../src/ui/shell.js';

function fixture(){
 const listeners=new Map(),props=new Map(),classes=new Set(['session-active']);
 let queued,callback,scroll=0;
 const target={addEventListener:(n,f)=>listeners.set(n,f),removeEventListener:n=>listeners.delete(n)};
 const card={getBoundingClientRect:()=>({top:100,bottom:300}),querySelector:()=>({getBoundingClientRect:()=>({top:240})}),get scrollTop(){return scroll},set scrollTop(v){scroll=v}};
 const input={matches:()=>true,closest:()=>card,getBoundingClientRect:()=>({top:280,bottom:328})};
 const doc={...target,activeElement:input,documentElement:{clientHeight:844},body:{classList:{contains:n=>classes.has(n),toggle:(n,on)=>on?classes.add(n):classes.delete(n),remove:n=>classes.delete(n)},style:{setProperty:(n,v)=>props.set(n,v),removeProperty:n=>props.delete(n)}}};
 const viewport={...target,height:400,offsetTop:45,scale:1};
 const win={...target,visualViewport:viewport,requestAnimationFrame:f=>(queued=f,1),cancelAnimationFrame:()=>queued=null,MutationObserver:class{constructor(f){callback=f}observe(){}disconnect(){}}};
 const flush=()=>{const f=queued;queued=null;f?.()};
 return {win,doc,viewport,props,classes,card,flush,change:()=>{callback();flush()}};
}

test('keyboard reduction sizes and pans the study shell and reveals the answer above its action',()=>{
 const f=fixture();const stop=installStudyViewport(f.win,f.doc);f.flush();
 assert.ok(f.classes.has('study-keyboard'));
 assert.equal(f.props.get('--study-height'),'400px');assert.equal(f.props.get('--study-top'),'45px');
 assert.equal(f.card.scrollTop,96);
 f.viewport.height=450;f.viewport.offsetTop=0;f.change();
 assert.equal(f.props.get('--study-height'),'450px');assert.equal(f.props.get('--study-top'),'0px');
 stop();assert.ok(!f.classes.has('study-keyboard'));assert.equal(f.props.size,0);
});

test('keyboard dismissal, zoom and leaving study restore the ordinary shell',()=>{
 for(const mutate of [f=>f.viewport.height=844,f=>f.viewport.scale=1.5,f=>f.classes.delete('session-active')]){
  const f=fixture();installStudyViewport(f.win,f.doc);f.flush();mutate(f);f.change();
  assert.ok(!f.classes.has('study-keyboard'));assert.equal(f.props.size,0);
 }
});

test('blur before clicking Check keeps the layout steady until the keyboard closes',()=>{
 const f=fixture();installStudyViewport(f.win,f.doc);f.flush();
 f.doc.activeElement=null;f.change();assert.ok(f.classes.has('study-keyboard'));
 f.viewport.height=844;f.change();assert.ok(!f.classes.has('study-keyboard'));
});

test('browser chrome alone and non-question inputs do not activate keyboard layout',()=>{
 for(const mutate of [f=>f.viewport.height=750,f=>f.doc.activeElement.closest=()=>null]){
  const f=fixture();mutate(f);installStudyViewport(f.win,f.doc);f.flush();assert.ok(!f.classes.has('study-keyboard'));
 }
 assert.doesNotThrow(()=>installStudyViewport({},{} )());
});
