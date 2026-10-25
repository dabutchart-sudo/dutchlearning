import {classifyOrigin} from '../engine/study-origin.js';
import {galleryExamples} from '../engine/question-type-gallery.js';
import {assess} from '../engine/scoring.js';
import {chooseTile,removeTile,bankAnswer,correctiveFeedback} from '../engine/exercises.js';
import {bindPeek} from './peek.js';
import {speak} from './speech.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const examples=galleryExamples();
const sessions=new Map(examples.map(example=>[example.kind,{...example,raw:'',selection:[],assisted:false,typedInstead:false,textFallback:false,disposePeek:()=>{}}]));

function allowed(){
 return classifyOrigin(globalThis.location?.hostname||'')!=='production';
}

function card(kind){
 return document.querySelector(`[data-question-type="${kind}"]`);
}

function answerArea(example){
 const q=example.question;
 if(q.options&&!(example.kind==='speaking')){
  return `<div class="answers">${q.options.map((option,i)=>`<button class="choice" type="button" data-choice="${i}" aria-pressed="false">${esc(option)}</button>`).join('')}</div>`;
 }
 if(example.kind==='speaking'&&!example.typedInstead){
  return `<p class="muted">No-cost simulation: choose a sample transcript to inspect feedback. This does not record or assess your speech.</p><div class="record-row"><button class="secondary" type="button" data-record>Use sample transcript</button></div><button class="text-link" type="button" data-skip-speaking>Skip speaking — type instead</button><p class="transcript" lang="nl" data-transcript>No sample transcript selected.</p>`;
 }
 if(example.kind==='wordbank'){
  return `<div class="built" data-built aria-label="Your sentence"></div><div class="wordbank" data-bank aria-label="Available words"></div><p class="muted small">Tap a chosen word to put it back. Extra words are deliberate.</p>`;
 }
 const placeholder=example.kind==='gap'?'Missing word or full sentence':example.kind==='correction'?'Missing letters':'Type in Dutch';
 const label=example.kind==='speaking'?'Typed Dutch answer':'Your Dutch answer';
 return `<label class="sr-only" for="gallery-input-${example.kind}">${label}</label><input id="gallery-input-${example.kind}" class="input" lang="nl" placeholder="${placeholder}" autocomplete="off" autocorrect="off" autocapitalize="${example.kind==='correction'?'none':'sentences'}" spellcheck="false" data-typed>`;
}

function promptText(example){
 if(example.kind==='listening'&&example.textFallback)return example.item.nl;
 return example.question.prompt;
}

function cardHTML(example){
 const q=example.question;
 const direction=q.direction==='en-nl'?'English → Dutch':'Dutch → English';
 const typedNote=example.kind==='speaking'&&example.typedInstead?'<p class="muted small">Typed instead of spoken. This demonstrates the typed fallback; it is not speaking evidence.</p>':'';
 const listenNote=example.kind==='listening'&&!example.textFallback?`<button class="secondary" type="button" data-play>Play Dutch audio</button><button class="text-link" type="button" data-text-fallback>Audio unavailable? Use text</button>`:'';
 const help=q.direction==='en-nl'&&['typed','wordbank'].includes(example.kind=== 'speaking'&&example.typedInstead?'typed':example.kind)?`<div class="assist-row"><button class="secondary" type="button" data-help>Hold for word</button><span class="hint" data-hint aria-live="polite"></span></div>`:'';
 return `<article class="card question-card" data-question-type="${esc(example.kind)}"><p class="direction">Question type: ${esc(example.kind)}</p><div class="q-type">${esc(example.title)}</div><p class="muted small">${esc(direction)}</p><h2 class="prompt">${esc(promptText(example))}</h2>${q.cue?`<p class="muted">Meaning: ${esc(q.cue)}</p>`:''}${listenNote}${typedNote}<div data-answer>${answerArea(example)}</div>${help}<div data-feedback aria-live="polite"></div><div class="actions"><button class="primary" type="button" data-check>Check answer</button></div></article>`;
}

function drawBank(example,root){
 const q=example.question;
 const built=root.querySelector('[data-built]');
 const bank=root.querySelector('[data-bank]');
 built.innerHTML=example.selection.map(id=>{
  const text=q.bank.find(tile=>tile.id===id)?.text||'';
  return `<button class="word" type="button" data-remove="${esc(id)}" aria-label="Remove ${esc(text)}">${esc(text)}</button>`;
 }).join('');
 bank.innerHTML=q.bank.map(tile=>`<button class="word ${example.selection.includes(tile.id)?'used':''}" type="button" data-tile="${esc(tile.id)}" ${example.selection.includes(tile.id)?'disabled':''}>${esc(tile.text)}</button>`).join('');
 bank.querySelectorAll('[data-tile]').forEach(button=>button.onclick=()=>{example.selection=chooseTile(example.selection,button.dataset.tile,q.bank);example.raw=bankAnswer(example.selection,q.bank);drawBank(example,root);});
 built.querySelectorAll('[data-remove]').forEach(button=>button.onclick=()=>{example.selection=removeTile(example.selection,button.dataset.remove);example.raw=bankAnswer(example.selection,q.bank);drawBank(example,root);});
}

function mount(example){
 example.disposePeek();
 const root=card(example.kind);
 if(!root)return;
 root.innerHTML=cardHTML(example).replace(/^<article[^>]*>|<\/article>$/g,'');
 if(example.kind==='wordbank')drawBank(example,root);
 root.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
  example.raw=example.question.options[Number(button.dataset.choice)];
  root.querySelectorAll('[data-choice]').forEach(choice=>{const on=choice===button;choice.classList.toggle('selected',on);choice.setAttribute('aria-pressed',String(on));});
 });
 const input=root.querySelector('[data-typed]');
 if(input){
  input.value=example.raw;
  input.oninput=()=>{example.raw=input.value;};
  input.onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();check(example);}};
 }
 const help=root.querySelector('[data-help]');
 const hint=root.querySelector('[data-hint]');
 if(help&&hint){
  example.disposePeek=bindPeek(help,hint,{
   reveal:example.item.vocabulary.map(word=>word.nl+' — '+word.en).join(' · '),
   onUse:()=>{example.assisted=true;return Promise.resolve();}
  });
 }
 root.querySelector('[data-check]').onclick=()=>check(example);
 root.querySelector('[data-play]')?.addEventListener('click',()=>speak(example.item.nl,message=>note(example,message)));
 root.querySelector('[data-text-fallback]')?.addEventListener('click',()=>{example.textFallback=true;example.raw='';mount(example);});
 root.querySelector('[data-record]')?.addEventListener('click',()=>record(example));
 root.querySelector('[data-skip-speaking]')?.addEventListener('click',()=>{example.typedInstead=true;example.raw='';mount(example);});
}

function note(example,text){
 const feedback=card(example.kind)?.querySelector('[data-feedback]');
 if(feedback&&text)feedback.innerHTML=`<p class="muted">${esc(text)}</p>`;
}

function record(example){
 example.raw=example.item.nl;
 const transcript=card(example.kind)?.querySelector('[data-transcript]');
 if(transcript)transcript.textContent=`Sample transcript: ${example.raw}`;
}

function scoringQuestion(example){
 if(example.kind==='speaking'&&example.typedInstead)return {...example.question,kind:'typed'};
 if(example.kind==='listening'&&example.textFallback)return {...example.question,kind:'choice',prompt:example.item.nl};
 return example.question;
}

function check(example){
 if(!String(example.raw).trim()){note(example,'Enter or choose an answer first.');return;}
 example.disposePeek();
 const q=scoringQuestion(example);
 const knownWords=new Set(example.item.nl.toLowerCase().replace(/[.!?]/g,'').split(/\s+/));
 const result=assess(q,example.raw,{assisted:example.assisted,knownWords});
 const feedback=correctiveFeedback(q,example.item,example.raw,result);
 const root=card(example.kind);
 root.querySelectorAll('input,button').forEach(control=>{control.disabled=true;});
 const title=result.grammar===true?(result.spelling===false?'Grammar correct · spelling to revisit':'Grammar correct'):result.grammar===null?'Vocabulary needs review':'Let’s revisit this pattern';
 root.querySelector('[data-feedback]').innerHTML=`<div class="feedback ${result.grammar===true?(result.spelling===false?'warn':'ok'):'bad'}"><strong>${esc(title)}</strong><span class="correct" lang="nl">${feedback.words.map(part=>part.changed?`<mark class="problem-char">${esc(part.text)}</mark>`:esc(part.text)).join(' ')}${esc(feedback.punctuation)}</span><span class="meaning">${esc(feedback.meaning)}</span>${feedback.explanation?`<p>${esc(feedback.explanation)}</p>`:''}${result.assisted?'<p>Word help was used on this example only.</p>':''}</div>`;
 const actions=root.querySelector('.actions');
 actions.innerHTML='<button class="secondary" type="button" data-again>Try again</button>';
 actions.querySelector('[data-again]').onclick=()=>{
  example.raw='';example.selection=[];example.assisted=false;example.typedInstead=false;example.textFallback=false;
  mount(example);
 };
}

function openGallery(){
 const content=document.getElementById('content');
 content.innerHTML=`<section class="question-gallery"><article class="card evidence-card"><div class="eyebrow">Development examples</div><h2>Question examples</h2><details><summary>About these examples</summary><p>Choose a question type below. Examples use one shared sentence so you can compare prompts, help and feedback. Listening here demonstrates the controls, not unseen listening ability.</p><p class="muted">Answers stay on this screen. They are not saved, and they do not change today’s 20, your course progress, or Flashcards.</p></details><button class="secondary" type="button" id="close-question-gallery">Back to Settings</button></article><label for="gallery-kind">Question type</label><select id="gallery-kind" class="input">${examples.map(example=>`<option value="${example.kind}">${esc(example.title)}</option>`).join('')}</select><div data-gallery-stage></div></section>`;
 document.getElementById('close-question-gallery').onclick=()=>document.querySelector('.tabs [data-view="settings"]')?.click();
 const select=document.getElementById('gallery-kind');
 const show=()=>{
  for(const example of sessions.values())example.disposePeek();
  const example=sessions.get(select.value);
  example.raw='';example.selection=[];example.assisted=false;example.typedInstead=false;example.textFallback=false;
  content.querySelector('[data-gallery-stage]').innerHTML=cardHTML(example);
  mount(example);
 };
 select.onchange=show;
 show();
 const heading=content.querySelector('h2');heading?.setAttribute('tabindex','-1');heading?.focus();
}

function installEntry(){
 if(!allowed())return;
 const root=document.getElementById('content');
 if(!root)return;
 if(!root.querySelector('.question-gallery'))for(const example of sessions.values())example.disposePeek();
 if(root.querySelector('#question-type-gallery-card')||root.querySelector('.question-gallery'))return;
 const stack=root.querySelector('.stack');
 const isSettings=[...(stack?.querySelectorAll('h2')||[])].some(heading=>heading.textContent.trim()==='Your app');
 if(!isSettings)return;
 const cardEl=document.createElement('article');
 cardEl.id='question-type-gallery-card';
 cardEl.className='card evidence-card';
 cardEl.innerHTML=`<div class="eyebrow">Development examples</div><h2>Question type examples</h2><p class="muted">Open one example of each daily question type. Trying an answer here does not affect your learning progress.</p><button id="open-question-gallery" class="secondary" type="button">Open question examples</button>`;
 stack.append(cardEl);
 cardEl.querySelector('#open-question-gallery').addEventListener('click',openGallery);
}

if(globalThis.document&&allowed()){
 const content=document.getElementById('content');
 if(content)new MutationObserver(installEntry).observe(content,{childList:true,subtree:true});
 installEntry();
}
