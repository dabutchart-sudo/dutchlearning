import {registerPacks} from '../content/registry.js';
import {freshState,ensureDay,unlocked,phase,teachConcept,prepareQuestion,prepareExtraQuestion,startExtraPractice,releaseExtraPractice,markWordsTaught,startProof,dailyProofOffer,releaseUnscoredPractice,submit,skipSpeaking,useHelp,EXTRA_PRACTICE_SIZE} from '../engine/learner.js';
import {createRepository,STORAGE_KEY} from '../engine/persistence.js';
import {dayKey,addDays} from '../engine/util.js';
import {labels} from '../engine/scoring.js';
import {chooseTile,removeTile,bankAnswer,correctiveFeedback} from '../engine/exercises.js';
import {coursePage,topicPage} from './course-overview.js';
import {paintDailyChrome} from './daily-chrome.js';
import {bindPeek} from './peek.js';
import {dutchVoice,speak,canUseServerListen} from './speech.js';
import {LISTENING_PRACTICE_SIZE,answerListeningPractice,currentListeningQuestion,listeningPracticeItems,listeningPracticeSummary,startListeningPractice} from '../engine/listening-practice.js';
const el=document.querySelector('#content'),message=document.querySelector('#system-message');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let content,state,repo,view='curriculum',dev=false,selectedConcept=null,lastFeedback=null,skipProofGate=false;
let listeningSession=null,listeningRun=0;
let disposePeek=()=>{};
let coursePane='path',courseDays=30,courseCohort='all',courseConcept=null,courseCohortTouched=false;
const now=()=>dev&&state?.settings?.debugDate?new Date(state.settings.debugDate+'T12:00:00'):new Date();
function notify(t){message.innerHTML=t?`<div class="error-message">${esc(t)}</div>`:'';}
function canListenNow(){return !!state?.settings?.listening&&(canUseServerListen()||!!dutchVoice());}
function button(id,label,primary=true,disabled=false){return `<button id="${id}" class="${primary?'primary':'secondary'}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
function on(id,fn){document.getElementById(id)?.addEventListener('click',()=>{try{const result=fn();if(result&&typeof result.then==='function')result.catch(e=>notify(e.message));}catch(e){notify(e.message);}});}
async function transaction(fn){
 const run=async()=>{const next=repo.load();const result=fn(next);repo.save(next);state=next;return result};
 // Web Locks serialise writes from tabs on this origin. Fallback stays functional in older browsers.
 if(navigator.locks)return navigator.locks.request(dev?STORAGE_KEY+'-sandbox':STORAGE_KEY,run);
 return run();
}
function proofReport(){const r=state.lastProof;if(!r)return '';return `<article class="card evidence-card proof-report"><div class="eyebrow">Latest ${esc(r.type)} result · ${esc(r.concept)}</div><h2>${r.passed?'Grammar proven in both directions':'More practice before the next test'}</h2><p>NL → EN: ${r.directions['nl-en'].correct}/${r.directions['nl-en'].total} · EN → NL: ${r.directions['en-nl'].correct}/${r.directions['en-nl'].total}</p><p class="muted small">${r.passed?(r.type==='mastery'?'Retention opens '+esc(state.progress[r.concept].retentionDue)+'.':'The next concept is unlocked. This one will return for maintenance.'):'Complete eight successful practice questions before trying fresh proof material again.'}</p></article>`}
function sessionChrome(active){document.body.classList.toggle('session-active',active);const footer=document.querySelector('footer');if(active)footer.setAttribute('aria-hidden','true');else footer.removeAttribute('aria-hidden');}
function markTopTab(){
 document.querySelectorAll('.tabs > .tab').forEach(tab=>{
  const onCourse=view==='curriculum'&&tab.id==='course-tab';
  const onSettings=view==='settings'&&tab.dataset.view==='settings';
  const onProgress=(view==='evidence'||view==='mistakes')&&tab.id==='progress-tab';
  tab.classList.toggle('active',onCourse||onSettings||onProgress);
 });
}
function refreshChrome({extra=false}={}){
 const offer=state&&content?dailyProofOffer(state,content,now()):null;
 paintDailyChrome({
  count:state?.daily?.count||0,
  done:(state?.daily?.count||0)>=20,
  testReady:!!offer?.canStartToday,
  extra:extra||state?.pending?.phase==='extra'
 });
}
function goHome(){selectedConcept=null;view='curriculum';render();}
function render(){
 disposePeek();sessionChrome(false);
 notify('');markTopTab();
 if(view==='curriculum'||view==='evidence')renderCourse();else if(view==='mistakes')renderMistakes();else if(view==='settings')renderSettings();
 refreshChrome();
 if(dev)el.insertAdjacentHTML('afterbegin',`<div class="debug-banner">Developer sandbox · ${dayKey(now())} · Real learning progress is separate.</div>`);
}
async function show(v){view=v;selectedConcept=null;lastFeedback=null;skipProofGate=false;if(v==='curriculum')coursePane='path';if(v==='evidence')coursePane='evidence';await transaction(s=>ensureDay(s,now()));render();}
function proofAction(id,offer=dailyProofOffer(state,content,now())){const p=state.progress[id],ph=phase(p,dayKey(now()));
 if(ph==='proof-ready'||ph==='retention-ready'){
 const type=ph==='proof-ready'?'mastery':'retention',reason=offer&&offer.id===id?offer.reason:null,hideButton=offer?.canStartToday&&offer.id===id;
 return `<div class="rule"><strong>${type==='mastery'?'Ready for mastery proof':'Ready to check retention'}</strong><p class="small">${type==='mastery'?'10 unseen Dutch → English and 10 unseen typed English → Dutch.':'5 unseen Dutch → English and 5 unseen typed English → Dutch.'} 100% grammar in each direction. No word help. The test uses this day’s questions, so start it before ordinary practice if you want it today.</p>${hideButton?'':button('proof',type==='mastery'?'Start Mastery Test':'Start Retention Test',true,!!reason)}${!hideButton&&reason?`<p class="small muted">${esc(reason)}</p>`:''}</div>`;
 }
 if(ph==='retention-wait')return `<div class="rule"><strong>Retention test opens ${esc(p.retentionDue)}</strong><p class="small">Three days after mastery. Until then, practise and revisit vocabulary within your daily 20.</p></div>`;
 return `<p class="muted small">${p.masteredAt?'Retained and in maintenance.':`Proof opens after 40 practice attempts. Independent production is tracked separately.${p.remedial?' '+p.remedial+' successful remedial questions remain.':''}`}</p>`;
}
function bindProof(id){on('proof',()=>proofPreparation(id));}
function vocabularyFor(id){return [...new Map(content.sentences.filter(x=>x.concept===id).flatMap(x=>x.vocabulary).map(w=>[w.id,w])).values()]}
function vocabularyHTML(words){return `<div class="vocabulary-list">${words.map(w=>`<div class="row"><strong lang="nl">${esc(w.nl)}</strong><span>${esc(w.en)}${w.mature?' <span class="pill">Mature card</span>':''}</span></div>`).join('')}</div>`}
function renderLesson(id,continueSession){
 sessionChrome(true);
 const c=content.conceptById[id];if(!unlocked(c,state))return;
 el.innerHTML=`<section class="session stack"><article class="card question-card"><span class="direction">Teach · not scored</span><h2>${esc(id)} · ${esc(c.title)}</h2><p>${esc(c.rule)}</p><div class="teach-panel"><div class="prompt" lang="nl">${esc(c.example)}</div><p>${esc(c.translation)}</p>${button('listen-example','Listen to the example',false)}</div><details><summary>Vocabulary for this concept</summary>${vocabularyHTML(vocabularyFor(id))}</details><div class="actions">${button('learned',continueSession?'Got it — let’s practise':'Back to the path')}</div></article></section>`;
 transaction(s=>teachConcept(s,id,content,{acknowledge:false})).catch(e=>notify(e.message));on('listen-example',()=>speak(c.example,notify));on('learned',async()=>{if(!continueSession){await show('curriculum');return;}await transaction(s=>teachConcept(s,id,content));await openQuestion();});
 refreshChrome();
}
async function proofPreparation(id){
 sessionChrome(true);
 const type=phase(state.progress[id],dayKey(now()))==='proof-ready'?'mastery':'retention';
 const words=vocabularyFor(id).filter(w=>!state.words[w.id]?.taughtAt);
 if(words.length){
  el.innerHTML=`<section class="session stack"><article class="card question-card session-briefing"><span class="direction">Vocabulary reminder · not scored</span><h2>Before your ${type} test</h2><p>Here is the remaining vocabulary for this concept. The test uses unseen sentences, with no assistance once it starts.</p>${vocabularyHTML(words)}<div class="actions">${button('begin-proof','Ready — start the test')}${button('cancel-proof','Back to the path',false)}</div></article></section>`;
  on('begin-proof',async()=>{await transaction(s=>{releaseUnscoredPractice(s);for(const w of words)markWordsTaught(s,{vocabulary:[w]},dayKey(now()));startProof(s,content,id,type,now())});await openQuestion()});on('cancel-proof',()=>show('curriculum'));
  refreshChrome();
 }else{await transaction(s=>{releaseUnscoredPractice(s);startProof(s,content,id,type,now())});await openQuestion();}
}
function renderProofGate(offer){
 sessionChrome(true);
 const title=offer.type==='mastery'?'Mastery Test':'Retention Test';
 el.innerHTML=`<section class="session stack"><article class="card question-card"><span class="direction">${esc(offer.id)} · ready today</span><h2>Take the ${title} before practice</h2><p>This test uses ${offer.needed} of today’s 20 questions. Practising first uses the day, and the test then waits until tomorrow.</p><div class="actions">${button('gate-proof','Start '+title)}${button('gate-practice','Practice anyway',false)}</div></article></section>`;
 on('gate-proof',()=>proofPreparation(offer.id));
 on('gate-practice',()=>{skipProofGate=true;openQuestion()});
 refreshChrome();
}
async function beginDaily({skipGate=false}={}){
 skipProofGate=skipGate;
 await transaction(s=>{if(s.pending?.phase==='extra')releaseExtraPractice(s)});
 await openQuestion();
}
async function beginExtra(id){
 skipProofGate=false;
 try{
  await transaction(s=>startExtraPractice(s,id,now()));
  await openExtraQuestion();
 }catch(e){notify(e.message)}
}
function listeningPracticeCard(){
 const available=listeningPracticeItems(state,content).length;
 return `<article class="card evidence-card"><div class="row"><div><div class="eyebrow">OPTIONAL PRACTICE · LISTENING</div><h2>Hear Dutch without seeing it</h2></div><span class="pill">Practice</span></div><p>Listen to a hidden Dutch sentence, then choose its English meaning. This short activity does not use today’s 20 or change Course, mastery, or retention progress.</p>${button('start-listening-practice',`Practise ${Math.min(LISTENING_PRACTICE_SIZE,available)} sentences`,true,!available)}${available?'':'<p class="small muted">Complete the first teaching step to unlock familiar sentences here.</p>'}</article>`;
}
function beginListeningPractice(){
 try{listeningRun++;listeningSession=startListeningPractice(state,content,{seed:`${dayKey(now())}:${state.learnerId}:${listeningRun}`});renderListeningPractice();}catch(e){notify(e.message)}
}
function renderListeningPractice(){
 sessionChrome(true);notify('');
 const q=currentListeningQuestion(listeningSession);
 if(!q){
  const summary=listeningPracticeSummary(listeningSession);
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${summary.heardCorrect} of ${summary.heard} heard answers correct</h2><p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'sentence used':'sentences used'} the visible-text fallback. ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was completed from audio without revealing the sentence.'}</p><p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-listening-practice','Practise another 5')}${button('leave-listening-practice','Back to Course',false)}</div></article></section>`;
  on('repeat-listening-practice',beginListeningPractice);on('leave-listening-practice',()=>{listeningSession=null;goHome()});return;
 }
 const item=content.byId[q.sourceId];let raw='',usedTextFallback=false,locked=false;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${listeningSession.index+1} of ${listeningSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card"><span class="direction">Dutch audio → English meaning</span><div class="q-type">Listen and choose the meaning</div><h2 class="prompt">Listen, then choose the meaning.</h2>${button('practice-play','Play Dutch audio',false)}<button id="practice-text-fallback" class="text-link">Audio unavailable? Show the Dutch text</button><div id="practice-visible-text"></div><div id="answer-area"><div class="answers">${q.options.map((option,index)=>`<button class="choice" data-practice-choice="${index}" aria-pressed="false">${esc(option)}</button>`).join('')}</div></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-listening-practice','Check answer')}</div></article><button id="leave-listening-practice" class="text-link">Leave practice — no Course progress to save</button></section>`;
 const area=document.getElementById('answer-area');area.querySelectorAll('[data-practice-choice]').forEach(choice=>choice.onclick=()=>{raw=q.options[Number(choice.dataset.practiceChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))})});
 on('practice-play',()=>speak(item.nl,notify));
 on('practice-text-fallback',()=>{usedTextFallback=true;document.getElementById('practice-visible-text').innerHTML=`<p class="prompt" lang="nl">${esc(item.nl)}</p><p class="small muted">Text shown: this answer will count only as recognition within this temporary session.</p>`;document.getElementById('practice-text-fallback').disabled=true;});
 on('check-listening-practice',()=>{if(locked)return;if(!raw){notify('Choose an answer first.');return;}locked=true;const next=answerListeningPractice(listeningSession,raw,{usedTextFallback});const result=next.answers.at(-1);listeningSession=next;el.querySelectorAll('button').forEach(button=>button.disabled=true);document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?'Meaning understood':'Not this time'}</strong><span class="correct" lang="nl">${esc(item.nl)}</span><span class="meaning">${esc(item.en)}</span><div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening diagnostic'}</span><span class="badge">Does not change progress</span></div></div>`;document.querySelector('.actions').innerHTML=button('next-listening-practice',currentListeningQuestion(listeningSession)?'Continue':'View listening summary');on('next-listening-practice',renderListeningPractice);document.getElementById('next-listening-practice').focus();});
 on('leave-listening-practice',()=>{listeningSession=null;goHome()});
}
async function openExtraQuestion(){
 lastFeedback=null;
 const q=await transaction(s=>prepareExtraQuestion(s,content,now(),canListenNow(),!!s.settings.speaking));
 if(!q){goHome();return;}
 renderQuestion(q);
}
async function openQuestion(){
 lastFeedback=null;
 if(!state.proof&&!skipProofGate){
  const offer=dailyProofOffer(state,content,now());
  if(offer?.canStartToday){renderProofGate(offer);return;}
 }
 const q=await transaction(s=>prepareQuestion(s,content,now(),canListenNow(),!!s.settings.speaking));
 if(!q){goHome();return;}if(q.teachingConcept){renderLesson(q.teachingConcept,true);return;}
 const item=content.byId[q.sourceId];const unknown=item.vocabulary.filter(w=>!state.words[w.id]?.taughtAt||(state.words[w.id].weakness>=3&&state.words[w.id].taughtAt<dayKey(now())));
 if(['practice','maintenance'].includes(q.phase)&&unknown.length){
  el.innerHTML=`<section class="session"><article class="card question-card"><span class="direction">Vocabulary reminder · not scored</span><h2>A few words before you practise</h2>${vocabularyHTML(unknown)}<p class="muted">You still have ${20-state.daily.count} scored questions today.</p><div class="actions">${button('words-learned','Got it — practise')}</div></article></section>`;
  on('words-learned',async()=>{await transaction(s=>markWordsTaught(s,item,dayKey(now())));renderQuestion(q)});return;
 }
 renderQuestion(q);
}
function renderQuestion(q){
 disposePeek();sessionChrome(true);
 refreshChrome({extra:q.phase==='extra'});
 const item=content.byId[q.sourceId];let selection=[],raw='',locked=false;
 const titles={choice:'Choose the English meaning',wordbank:'Build the Dutch sentence',typed:'Write the Dutch sentence',gap:'Fill the missing form',form:'Choose the correct form','correct-sentence':'Choose the matching Dutch sentence',correction:'Correct the Dutch sentence',listening:'Listen and choose the meaning',speaking:'Say the Dutch sentence'};
 const extra=q.phase==='extra';
 const extraIndex=extra?EXTRA_PRACTICE_SIZE-(state.extra?.remaining||0)+1:0;
 const offer=state.proof||extra?null:dailyProofOffer(state,content,now());
 const proofNote=offer?.canStartToday?`<p class="muted small">The ${esc(offer.id)} ${offer.type} test is ready and needs ${offer.needed} free questions today. Take it before you finish this practice question, or it waits until tomorrow.</p>`:offer?`<p class="muted small">The ${esc(offer.id)} ${offer.type} test is ready. It needs ${offer.needed} free questions, so it opens tomorrow.</p>`:'';
 el.innerHTML=`<section class="session"><div class="session-head"><strong>${extra?`Extra practice ${extraIndex} of ${EXTRA_PRACTICE_SIZE}`:`Question ${state.daily.count+1} of 20 today`}</strong><span class="pill">${esc(q.concept)} · ${extra?'extra practice':esc(q.phase)}</span></div>${state.proof?`<p class="muted small">Test: ${state.proof.index+1} / ${state.proof.questions.length}. Each direction must reach 100% grammar.</p>`:extra?'<p class="muted small">Extra practice. This does not use today’s 20 questions.</p>':proofNote}<article class="card question-card"><span class="direction">${q.direction==='en-nl'?'English → Dutch':'Dutch → English'}</span><div class="q-type">${titles[q.kind]}</div><h2 class="prompt" ${q.direction==='nl-en'&&q.kind!=='listening'||['gap','form','correction'].includes(q.kind)?'lang="nl"':''}>${esc(q.prompt)}</h2>${q.cue?`<p class="muted">Meaning: ${esc(q.cue)}</p>`:''}${q.kind==='listening'?`${button('play','Play Dutch audio',false)}<button id="text-fallback" class="text-link">Audio unavailable? Use text</button>`:''}${q.kind==='speaking'?'<p class="muted">Say the Dutch sentence, or skip and type if you cannot talk now.</p>':''}<div id="answer-area"></div><div id="help-area"></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check','Check answer')}</div></article><button id="pause" class="text-link">Pause — progress is saved</button></section>`;
 const area=document.getElementById('answer-area');
 if(q.options){area.innerHTML=`<div class="answers">${q.options.map((o,i)=>`<button class="choice" data-choice="${i}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>`;area.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{raw=q.options[Number(b.dataset.choice)];area.querySelectorAll('button').forEach(x=>{x.classList.toggle('selected',x===b);x.setAttribute('aria-pressed',String(x===b))})});}
 else if(q.kind==='speaking'){
  area.innerHTML=`<div class="record-row">${button('record','Record answer',false)}</div><button id="skip-speaking" class="text-link" type="button">Skip speaking — type instead</button><p id="spoken-transcript" class="transcript" lang="nl">Nothing recorded yet.</p>`;
  const Rec=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
  on('record',()=>{
   notify('');
   if(!Rec){notify('This device cannot record speech here. Skip and type instead.');return;}
   const recognition=new Rec();recognition.lang='nl-NL';recognition.interimResults=false;
   recognition.onresult=e=>{raw=e.results[0][0].transcript;const t=document.getElementById('spoken-transcript');if(t)t.textContent=raw;};
   recognition.onerror=()=>notify('Speech could not be captured. Skip and type instead.');
   recognition.start();
  });
  on('skip-speaking',async()=>{const next=await transaction(s=>skipSpeaking(s));renderQuestion(next);});
 }
 else if(q.kind==='wordbank'){
  area.innerHTML='<div id="built" class="built" aria-label="Your sentence"></div><div id="bank" class="wordbank" aria-label="Available words"></div><p class="muted small">Tap a chosen word to put it back. Extra words are deliberate.</p>';
  const draw=()=>{document.getElementById('built').innerHTML=selection.map(id=>`<button class="word" data-remove="${id}" aria-label="Remove ${esc(q.bank.find(x=>x.id===id).text)}">${esc(q.bank.find(x=>x.id===id).text)}</button>`).join('');document.getElementById('bank').innerHTML=q.bank.map(t=>`<button class="word ${selection.includes(t.id)?'used':''}" data-tile="${t.id}" ${selection.includes(t.id)?'disabled':''}>${esc(t.text)}</button>`).join('');area.querySelectorAll('[data-tile]').forEach(b=>b.onclick=()=>{selection=chooseTile(selection,b.dataset.tile,q.bank);draw()});area.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{selection=removeTile(selection,b.dataset.remove);draw()});raw=bankAnswer(selection,q.bank)};draw();
 }else{area.innerHTML='<label for="typed-answer" class="sr-only">Your Dutch answer</label><input id="typed-answer" class="input" lang="nl" placeholder="Type in Dutch" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false">';const input=document.getElementById('typed-answer');if(q.kind==='gap'){input.placeholder='Missing word or full sentence';input.setAttribute('aria-label','Missing word or full sentence');}input.oninput=()=>raw=input.value;input.onkeydown=e=>{if(e.key==='Enter'&&!e.isComposing)check()};}
 if(q.direction==='en-nl'&&['typed','wordbank'].includes(q.kind)&&['practice','maintenance','extra'].includes(q.phase)){
  const help=document.getElementById('help-area');help.innerHTML=`<div class="assist-row">${button('help','Hold for word',false)}<span id="hint" class="hint" aria-live="polite"></span></div>`;
  disposePeek=bindPeek(document.getElementById('help'),document.getElementById('hint'),{
   reveal:item.vocabulary.map(w=>w.nl+' — '+w.en).join(' · '),
   onUse:()=>transaction(s=>{if(s.pending?.id!==q.id)throw Error('This question has changed.');useHelp(s)}),
   onError:e=>notify(e.message)
  });
 }
 async function check(){if(locked)return;if(!raw.trim()){notify('Enter or choose an answer first.');return;}locked=true;disposePeek();
  try{const rec=await transaction(s=>submit(s,content,q.id,raw,now()));lastFeedback=rec;refreshChrome({extra:q.phase==='extra'});const feedback=correctiveFeedback(q,item,raw,rec);
   el.querySelectorAll('input,button').forEach(b=>b.disabled=true);document.getElementById('feedback').innerHTML=`<div class="feedback ${rec.grammar===true?(rec.spelling===false?'warn':'ok'):'bad'}"><strong>${rec.grammar===true?(rec.spelling===false?'Grammar correct · spelling to revisit':'Grammar correct'):rec.grammar===null?'Vocabulary needs review':'Let’s revisit this pattern'}</strong><span class="correct" lang="nl">${feedback.words.map(part=>part.changed?`<mark class="problem-char">${esc(part.text)}</mark>`:esc(part.text)).join(' ')}${esc(feedback.punctuation)}</span><span class="meaning">${esc(feedback.meaning)}</span>${feedback.differences.length?`<p lang="nl">${feedback.differences.map(esc).join(' · ')}</p>`:''}${feedback.explanation?`<p>${esc(feedback.explanation)}</p>`:''}${rec.capitalization===false?'<p>Start the sentence with a capital letter. This is separate from grammar.</p>':''}<div class="badges"><span class="badge">Grammar ${rec.grammar===true?'✓':rec.grammar===null?'unproven':'review'}</span>${rec.spelling!==null?`<span class="badge">Spelling ${rec.spelling?'✓':'review'}</span>`:''}${rec.capitalization!==null?`<span class="badge">Capitalisation ${rec.capitalization?'✓':'review'}</span>`:''}${rec.assisted?'<span class="badge">Word help used</span>':''}</div></div>`;
   const extraDone=q.phase==='extra'&&!state.extra;
   document.querySelector('.actions').innerHTML=button('next',extraDone?'Back to the path':state.daily.count===20?'Finish today’s 20':!state.proof&&['mastery','retention'].includes(q.phase)?'View test result':'Continue');
   on('next',()=>{
    if(q.phase==='extra'){if(state.extra)openExtraQuestion();else{selectedConcept=q.concept;view='curriculum';render();}}
    else if(state.daily.count===20||!state.proof&&['mastery','retention'].includes(q.phase))show('curriculum');
    else openQuestion();
   });document.getElementById('next').focus();
  }catch(e){locked=false;notify(e.message)}
 }
 on('check',check);on('pause',()=>{
  if(q.phase==='extra'){transaction(s=>releaseExtraPractice(s)).then(()=>{selectedConcept=q.concept;view='curriculum';render();});return;}
  show('curriculum');
 });on('play',()=>speak(item.nl,notify));on('text-fallback',async()=>{await transaction(s=>{if(s.pending?.id===q.id){s.pending.kind='choice';s.pending.prompt=item.nl}});renderQuestion(state.pending)});
}
function renderCourse(){
 const today=dayKey(now());
 if(selectedConcept){
  el.innerHTML=topicPage(state,content,selectedConcept,{today,proofHTML:proofAction(selectedConcept),dailyCount:state.daily.count,dailyDone:state.daily.count>=20});
  on('read-course',()=>renderLesson(selectedConcept,false));
  on('back-course',()=>{selectedConcept=null;renderCourse();el.querySelector('h2')?.focus()});
  on('start-course',()=>beginDaily({skipGate:false}));
  on('extra-course',()=>beginExtra(selectedConcept));
  bindProof(selectedConcept);return;
 }
 el.innerHTML=coursePage(state,content,{today,pane:view==='evidence'?'evidence':coursePane,days:courseDays,cohort:courseCohort,concept:courseConcept,offer:dailyProofOffer(state,content,now())});
 if(view!=='evidence'&&state.lastProof)el.querySelector('.course-heading')?.insertAdjacentHTML('afterend',proofReport());
 if(view!=='evidence'){
  const heading=el.querySelector('.course-heading');if(heading)heading.insertAdjacentHTML('afterend',listeningPracticeCard());else el.insertAdjacentHTML('afterbegin',listeningPracticeCard());
  on('start-listening-practice',beginListeningPractice);
 }
 el.querySelectorAll('[data-course-pane]').forEach(b=>b.onclick=()=>{coursePane=b.dataset.coursePane;renderCourse();el.querySelector(`[data-course-pane="${coursePane}"]`)?.focus()});
 el.querySelectorAll('[data-course-cohort]').forEach(b=>b.onclick=()=>{courseCohortTouched=true;courseCohort=b.dataset.courseCohort;renderCourse();el.querySelector(`[data-course-cohort="${courseCohort}"]`)?.focus()});
 el.querySelectorAll('[data-course-concept]').forEach(b=>b.onclick=()=>{selectedConcept=b.dataset.courseConcept;renderCourse();el.querySelector('h2')?.focus()});
 el.querySelectorAll('[data-course-start]').forEach(b=>b.onclick=()=>beginDaily({skipGate:false}));
 el.querySelectorAll('[data-course-extra]').forEach(b=>b.onclick=()=>beginExtra(b.dataset.courseExtra));
 const currentNode=el.querySelector('[data-course-current]');
 if(currentNode)currentNode.scrollIntoView({block:'center',behavior:'auto'});
 const period=document.getElementById('course-period');if(period)period.onchange=()=>{courseDays=period.value==='all'?null:Number(period.value);renderCourse();document.getElementById('course-period')?.focus()};
 const topic=document.getElementById('course-topic-filter');if(topic)topic.onchange=()=>{courseConcept=topic.value||null;renderCourse();document.getElementById('course-topic-filter')?.focus()};
}

function renderMistakes(){
 const bad=state.attempts.filter(x=>x.grammar!==true||x.spelling===false||x.capitalization===false||x.assisted);const counts={};for(const a of bad){const type=a.errorType||(a.capitalization===false?'capitalization':'translation');counts[type]=(counts[type]||0)+1;}
 const weak=Object.entries(state.words).filter(([,w])=>w.weakness>0).sort((a,b)=>b[1].weakness-a[1].weakness).slice(0,10);const vocab=new Map(content.sentences.flatMap(x=>x.vocabulary).map(w=>[w.id,w]));
 el.innerHTML=`<section class="stack mistakes-view"><article class="card evidence-card"><h2>Mistakes & weak areas</h2><p class="muted">Useful evidence, not penalties. Successful recall gradually reduces repetition priority.</p>${bad.length?`<div class="error-grid">${Object.entries(counts).map(([k,n])=>`<div class="error-chip"><span class="eyebrow">${esc(labels[k]||k)}</span><span class="n">${n}</span><span class="small muted">recorded so far</span></div>`).join('')}</div>`:'<div class="empty">No mistakes recorded yet. Start today’s practice to build your learning evidence.</div>'}</article>${weak.length?`<article class="card evidence-card"><h3>Current word priorities</h3><p>${weak.map(([id])=>esc(vocab.get(id)?.nl||id)).join(' · ')}</p></article>`:''}<div class="recent-mistakes">${bad.slice(-25).reverse().map(a=>`<article class="card evidence-card"><div class="eyebrow">${esc(a.concept)} · ${esc(labels[a.errorType]||(a.capitalization===false?'Capitalisation':'Review'))}</div><h3>${esc(a.prompt)}</h3><p class="small">Your answer: ${esc(a.answer)}<br>Model: <strong>${esc(a.correctSentence||content.byId[a.sourceId]?.nl||a.expected)}</strong><br>${esc(a.englishMeaning||content.byId[a.sourceId]?.en||'')}</p>${a.tip?`<p class="tipbox">${esc(a.tip)}</p>`:''}</article>`).join('')}</div></section>`;
}
function renderSettings(){
 el.innerHTML=`<section class="stack"><article class="card evidence-card"><h2>Your app</h2><div class="settings-row row"><label for="listening">Include one listening question in today’s 20</label><input id="listening" type="checkbox" ${state.settings.listening?'checked':''}></div><div class="settings-row row"><label for="speaking">Include one spoken Dutch question when I can talk</label><input id="speaking" type="checkbox" ${state.settings.speaking?'checked':''}></div><p class="muted small">${canUseServerListen()||dutchVoice()?'Listening uses the same Dutch audio as Flashcards.':'Listening audio is not available on this copy yet. Other exercise types remain available.'} Spoken questions can always be skipped and typed. Mastery and retention tests stay written.</p><h3>Where to study</h3><p>Use the GitHub Pages app for genuine Learning and Flashcards. A local or 192.168 address is a development copy with separate browser storage — do not treat it as production.</p><h3>Install & use offline</h3><p>On iPhone or iPad, open the hosted app in Safari, tap Share, then Add to Home Screen. On supported Mac Safari versions, use Add to Dock. Open online once and wait for “Ready offline” below.</p><h3>Progress stays on this device</h3><p class="muted">Export a backup before changing devices, clearing browser data, or moving to a different hosted address. V5 does not sync automatically.</p>${button('export','Export progress',false)} <label class="text-link" for="import">Import V5 backup</label><input id="import" type="file" accept="application/json,.json" class="input spaced"><p class="small muted">Import replaces this app’s current progress. Keep your export first.</p>${state.migration?`<p class="notice">${esc(state.migration.from)} progress imported on this browser origin.</p>`:''}</article><article class="card evidence-card"><details ${dev?'open':''}><summary>Developer & test controls</summary><p class="muted">Use a separate sandbox to jump through states without changing real learning history.</p>${button('toggle-dev',dev?'Return to real learning':'Open developer sandbox',false)}${dev?`<div class="stack spaced"><label>Concept <select id="dev-concept">${content.concepts.map(c=>`<option value="${c.id}">${c.id} · ${esc(c.title)}</option>`).join('')}</select></label><label>State <select id="dev-state"><option value="learning">Learning</option><option value="construct">Construct</option><option value="produce">Produce / Repeat</option><option value="proof-ready">Proof Ready</option><option value="retention-wait">Retention pending</option><option value="retention-ready">Retention Ready</option><option value="mastered">Mastered</option><option value="reinforcement">Reinforcement</option></select></label>${button('jump','Apply sandbox state',false)}${button('next-day','Advance sandbox by one day',false)}${button('reset-sandbox','Fresh sandbox',false)}</div>`:''}</details></article></section>`;
 document.getElementById('listening').onchange=async e=>{try{await transaction(s=>s.settings.listening=e.target.checked)}catch(err){notify(err.message)}};
 document.getElementById('speaking').onchange=async e=>{try{await transaction(s=>s.settings.speaking=e.target.checked)}catch(err){notify(err.message)}};
 on('export',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([repo.export(state)],{type:'application/json'}));a.download=`dutch-trainer-v5${dev?'-sandbox':''}-${dayKey(now())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
 document.getElementById('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(!confirm('Replace current V5 progress with this backup?'))return;const text=await f.text();state=repo.import(text);render();}catch(err){notify(err.message)}};
 on('toggle-dev',()=>{dev=!dev;repo=createRepository(localStorage,content,{key:dev?STORAGE_KEY+'-sandbox':STORAGE_KEY});state=repo.load();repo.save(state);render()});
 on('next-day',async()=>{await transaction(s=>{s.settings.debugDate=addDays(dayKey(now()),1);ensureDay(s,new Date(s.settings.debugDate+'T12:00:00'))});render()});
 on('reset-sandbox',()=>{state=freshState(content);repo.save(state);render()});
 on('jump',async()=>{const id=document.getElementById('dev-concept').value,ph=document.getElementById('dev-state').value;await transaction(s=>{const idx=content.concepts.findIndex(c=>c.id===id);for(const [i,c]of content.concepts.entries()){s.progress[c.id]=freshState(content).progress[c.id];if(i<idx)Object.assign(s.progress[c.id],{status:'mastered',masteredAt:dayKey(now()),nextMaintenance:addDays(dayKey(now()),7),taught:true});}const p=s.progress[id];Object.assign(p,{taught:ph!=='learning',recognised:ph==='learning'?0:4,constructed:['learning','construct'].includes(ph)?0:4,practiceAttempts:['learning','construct','produce'].includes(ph)?0:40,independent:['learning','construct','produce'].includes(ph)?0:8,status:['construct','produce'].includes(ph)?'learning':ph});if(ph.startsWith('retention'))p.retentionDue=addDays(dayKey(now()),ph==='retention-ready'?0:3);if(['mastered','reinforcement'].includes(ph)){p.masteredAt=dayKey(now());p.nextMaintenance=dayKey(now())}s.daily={date:dayKey(now()),count:0};s.pending=null;s.proof=null;s.lastProof=null;s.retries=[];});view='curriculum';render()});
}
async function init(){
 const manifestURL=new URL('../content/packs.json',import.meta.url);const response=await fetch(manifestURL);if(!response.ok)throw Error('The course could not load. Reconnect and refresh once.');const manifest=await response.json();const packs=await Promise.all(manifest.packs.map(async path=>{const r=await fetch(new URL(path,manifestURL));if(!r.ok)throw Error('A course pack could not load. Reconnect and refresh.');return r.json()}));content=registerPacks(packs);repo=createRepository(localStorage,content);state=repo.load();repo.save(state);await transaction(s=>ensureDay(s));render();
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view).catch(e=>notify(e.message)));
 window.addEventListener('storage',e=>{if(e.key===(dev?STORAGE_KEY+'-sandbox':STORAGE_KEY)){state=repo.load();view='curriculum';render();notify('Progress updated in another tab. Continue from the saved question.')}});
 if(document.body.classList.contains('is-development')){
  if('serviceWorker'in navigator){try{const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()));}catch{}}
  document.getElementById('offline-status').textContent='Development copy · not cached for genuine study';
 }else if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js',{scope:'./'});await navigator.serviceWorker.ready;document.getElementById('offline-status').textContent='Ready offline · progress saved locally';}catch{document.getElementById('offline-status').textContent='Offline cache unavailable — keep this page online';}}
 else document.getElementById('offline-status').textContent='Offline installation needs HTTPS hosting';
}
init().catch(e=>{el.innerHTML='<article class="card evidence-card"><h2>The app could not open safely</h2><p>Your stored progress has not been cleared. Export or preserve the existing browser data before recovery.</p><p>Refresh after reconnecting if the course could not load.</p></article>';notify(e.message)});
