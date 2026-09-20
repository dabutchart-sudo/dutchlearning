import {listeningOptions,SAMPLE,scoreListening,scoreSpeaking} from '../src/engine/listen-speak-preview.js';

const el=document.getElementById('content');
const statusEl=document.getElementById('openai-status');
const notice=document.getElementById('system-message');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const titles={listen:'Listen and choose the meaning',speak:'Say the Dutch sentence'};

let step='listen';
let choice='';
let transcript='';
let recorder=null;
let chunks=[];
let ready={openai:false,reason:''};
let dutchAudioUrl='';
let busy='';
let skipSpeak=false;
let typeInstead=false;

function notify(message){
 notice.textContent=message||'';
 notice.className=message?'error-message':'';
}

function button(id,label,primary=true){
 return `<button id="${id}" class="${primary?'primary':'secondary'}" type="button">${esc(label)}</button>`;
}

async function refreshStatus(){
 try{
  const response=await fetch('/preview/status');
  ready=await response.json();
  statusEl.textContent=ready.openai?'OpenAI is available on this preview server.':'Add the OpenAI key to the preview-server environment to play and transcribe audio.';
 }catch{
  ready={openai:false,reason:'status-failed'};
  statusEl.textContent='The preview server is not responding.';
 }
}

async function ensureDutchAudio(){
 if(dutchAudioUrl)return dutchAudioUrl;
 const response=await fetch('/preview/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:SAMPLE.nl})});
 if(!response.ok)throw Error((await response.json().catch(()=>({}))).error||'Dutch audio could not be generated.');
 dutchAudioUrl=URL.createObjectURL(await response.blob());
 return dutchAudioUrl;
}

async function playDutch(){
 notify('');
 if(!ready.openai){notify('OpenAI is not available on this preview server yet.');return;}
 const play=document.getElementById('play');
 if(play)play.textContent=dutchAudioUrl?'Playing…':'Preparing audio…';
 try{
  const audio=new Audio(await ensureDutchAudio());
  await audio.play();
 }finally{
  if(play)play.textContent='Play Dutch audio';
 }
}

async function transcribe(blob){
 const body=new FormData();
 body.append('audio',blob,'speech.webm');
 const response=await fetch('/preview/stt',{method:'POST',body});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(payload.error||'Speech could not be transcribed.');
 return String(payload.text||'');
}

async function toggleRecord(){
 notify('');
 if(recorder){
  recorder.stop();
  return;
 }
 if(!ready.openai){notify('OpenAI is not available on this preview server yet.');return;}
 const stream=await navigator.mediaDevices.getUserMedia({audio:true});
 chunks=[];
 recorder=new MediaRecorder(stream);
 recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
 recorder.onstop=async()=>{
  stream.getTracks().forEach(track=>track.stop());
  recorder=null;
  busy='Transcribing…';
  renderSpeak();
  try{
   transcript=await transcribe(new Blob(chunks,{type:'audio/webm'}));
  }catch(err){notify(err.message)}
  busy='';
  renderSpeak();
 };
 recorder.start();
 renderSpeak();
}

function renderListen(){
 const options=listeningOptions(SAMPLE,20);
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Exercise 1 of 2</strong><span class="pill">Test area</span></div>
  <article class="card question-card">
   <span class="direction">Dutch → English</span>
   <div class="q-type">${titles.listen}</div>
   <h2 class="prompt">Listen, then choose the meaning.</h2>
   ${button('play','Play Dutch audio',false)}
   <div id="answer-area" class="answers spaced">${options.map((option,i)=>`<button class="choice" data-choice="${i}" aria-pressed="false" type="button">${esc(option)}</button>`).join('')}</div>
   <div id="feedback" aria-live="polite"></div>
   <div class="actions">${button('check','Check answer')}</div>
  </article>
 </section>`;
 el.querySelectorAll('[data-choice]').forEach(buttonEl=>{
  buttonEl.onclick=()=>{
   choice=options[Number(buttonEl.dataset.choice)];
   el.querySelectorAll('[data-choice]').forEach(other=>{
    other.classList.toggle('selected',other===buttonEl);
    other.setAttribute('aria-pressed',String(other===buttonEl));
   });
  };
 });
 document.getElementById('play').onclick=()=>playDutch().catch(err=>notify(err.message));
 document.getElementById('check').onclick=()=>{
  if(!choice){notify('Choose a meaning first.');return;}
  const result=scoreListening(choice);
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?'Grammar correct':'Let’s revisit this pattern'}</strong><span class="correct" lang="nl">${esc(SAMPLE.nl)}</span><span class="meaning">${esc(SAMPLE.en)}</span></div>`;
  document.querySelector('.actions').innerHTML=button('next',skipSpeak?'Finish this pair':'Continue to speaking');
  document.getElementById('next').onclick=()=>{if(skipSpeak){step='listen';choice='';transcript='';typeInstead=false;notify('');renderListen();return;}step='speak';renderSpeak()};
 };
}

function renderSpeak(){
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Exercise 2 of 2</strong><span class="pill">Test area</span></div>
  <article class="card question-card">
   <span class="direction">English → Dutch</span>
   <div class="q-type">${titles.speak}</div>
   <h2 class="prompt">${esc(SAMPLE.en)}</h2>
   <p class="muted">${typeInstead?'Type the Dutch sentence. Speaking is skipped.':'Say the Dutch sentence, or skip and type if you cannot talk now. The preview server never sends a key to this page.'}</p>
   ${typeInstead?`<label for="typed-answer" class="sr-only">Your Dutch answer</label><input id="typed-answer" class="input" lang="nl" placeholder="Type in Dutch" value="${esc(transcript)}">`:`<div class="record-row">${button('record',recorder?'Stop recording':busy?'Transcribing…':'Record answer',false)}</div><button id="skip-speaking" class="text-link" type="button">Skip speaking — type instead</button><p class="transcript" lang="nl">${esc(busy||transcript||'Nothing recorded yet.')}</p>`}
   <div id="feedback" aria-live="polite"></div>
   <div class="actions">${button('check','Check answer')}</div>
  </article>
 </section>`;
 document.getElementById('record')?.addEventListener('click',()=>toggleRecord().catch(err=>notify(err.message)));
 if(busy&&document.getElementById('record'))document.getElementById('record').disabled=true;
 document.getElementById('skip-speaking')?.addEventListener('click',()=>{typeInstead=true;notify('');renderSpeak();});
 document.getElementById('typed-answer')?.addEventListener('input',e=>{transcript=e.target.value;});
 document.getElementById('check').onclick=()=>{
  const result=scoreSpeaking(transcript);
  const title=result.correct?'Spoken Dutch matches':result.near?'Almost — listen again':result.empty?'Record an answer first':'Let’s revisit this pattern';
  if(result.empty){notify(title);return;}
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':result.near?'warn':'bad'}"><strong>${title}</strong><span class="correct" lang="nl">${esc(result.expected)}</span><span class="meaning">${esc(SAMPLE.en)}</span><p>Heard: ${esc(transcript)}</p></div>`;
  document.querySelector('.actions').innerHTML=button('again','Try the pair again',false);
  document.getElementById('again').onclick=()=>{step='listen';choice='';transcript='';typeInstead=false;notify('');renderListen()};
 };
}

const skipBox=document.getElementById('skip-speak');
if(skipBox){
 skipBox.checked=skipSpeak;
 skipBox.onchange=()=>{
  skipSpeak=skipBox.checked;
  if(skipSpeak&&step==='speak'){typeInstead=true;notify('');renderSpeak();}
 };
}

await refreshStatus();
if(step==='listen')renderListen();
else renderSpeak();
if(ready.openai)ensureDutchAudio().catch(()=>{});
