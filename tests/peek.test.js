import test from 'node:test';
import assert from 'node:assert/strict';
import {bindPeek} from '../src/ui/peek.js';
class Element extends EventTarget{style={};attrs={};textContent='';disabled=false;isConnected=true;id='hint';setAttribute(k,v){this.attrs[k]=v}focus(){}setPointerCapture(){}}
function event(target,type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,props);target.dispatchEvent(e);}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(onUse=async()=>{}){const button=new Element(),hint=new Element(),win=new EventTarget(),doc=new EventTarget();const dispose=bindPeek(button,hint,{reveal:'schrijven — write',onUse,window:win,document:doc});return {button,hint,win,doc,dispose};}
test('mouse/touch/pen release and cancellation erase peek; click does not latch',async()=>{
 for(const pointerType of ['mouse','touch','pen'])for(const release of ['pointerup','pointercancel','pointerleave','lostpointercapture','blur']){
  let uses=0;const {button,hint,dispose}=setup(async()=>uses++);
  event(button,'pointerdown',{button:0,pointerId:1,pointerType});await tick();assert.equal(hint.textContent,'schrijven — write');assert.equal(uses,1);
  event(button,release);assert.equal(hint.textContent,'Hold to see dictionary words.');event(button,'click');assert.equal(button.attrs['aria-pressed'],'false');dispose();
 }
});
test('keyboard Space and Enter reveal only while held; repeats do not duplicate use',async()=>{
 for(const key of [' ','Enter']){let uses=0;const {button,hint,dispose}=setup(async()=>uses++);
  event(button,'keydown',{key,repeat:false});event(button,'keydown',{key,repeat:true});await tick();assert.equal(uses,1);assert.equal(button.attrs['aria-pressed'],'true');
  event(button,'keyup',{key});assert.equal(hint.textContent,'Hold to see dictionary words.');dispose();
 }
});
test('release during a pending save never reveals late, while assistance is still recorded',async()=>{
 let resolve,uses=0;const {button,hint,dispose}=setup(()=>{uses++;return new Promise(r=>resolve=r)});
 event(button,'pointerdown',{button:0,pointerId:1});event(button,'pointerup');resolve();await tick();assert.equal(uses,1);assert.equal(hint.textContent,'Hold to see dictionary words.');dispose();
});
test('window blur, hidden document and disposal erase help and detach listeners',async()=>{
 for(const reason of ['blur','hidden','dispose']){const {button,hint,win,doc,dispose}=setup();event(button,'keydown',{key:' ',repeat:false});await tick();
  if(reason==='blur')event(win,'blur');if(reason==='hidden'){doc.hidden=true;event(doc,'visibilitychange')}if(reason==='dispose')dispose();
  assert.equal(hint.textContent,'Hold to see dictionary words.');dispose();event(button,'keydown',{key:' ',repeat:false});await tick();assert.equal(button.attrs['aria-pressed'],'false');
 }
});
