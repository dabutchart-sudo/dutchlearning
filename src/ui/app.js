import {registerPacks} from '../content/registry.js';
import {freshState,ensureDay,unlocked,phase,teachConcept,prepareQuestion,prepareExtraQuestion,startExtraPractice,releaseExtraPractice,markWordsTaught,startProof,dailyProofOffer,releaseUnscoredPractice,submit,skipSpeaking,useHelp,EXTRA_PRACTICE_SIZE} from '../engine/learner.js';
import {createRepository,STORAGE_KEY} from '../engine/persistence.js';
import {dayKey,addDays,normalize} from '../engine/util.js';
import {labels} from '../engine/scoring.js';
import {masteryRecovery} from '../engine/mastery-recovery.js';
import {chooseTile,removeTile,bankAnswer,correctiveFeedback} from '../engine/exercises.js';
import {coursePage,topicPage} from './course-overview.js';
import {paintDailyChrome} from './daily-chrome.js';
import {bindPeek} from './peek.js';
import {questionHeader,answerFeedback} from './learning-session-ui.js';
import {lessonMaterial,guidanceFor,patternTipFor} from './teaching-support.js';
import {dutchVoice,speak,prepareSpeech,discardPreparedSpeech,canUseServerListen,SLOWER_RATE} from './speech.js';
import {LISTENING_PRACTICE_SIZE,answerListeningPractice,currentListeningQuestion,listeningPracticeItems,listeningPracticeSummary,startListeningPractice} from '../engine/listening-practice.js';
import {answerSentenceDiscrimination,currentDiscriminationQuestion,discriminationSummary,startSentenceDiscrimination} from '../engine/listening-discrimination.js';
import {answerMissingWord,currentMissingWordQuestion,missingWordSummary,startMissingWord} from '../engine/listening-missing-word.js';
import {answerDictation,currentDictationQuestion,dictationMarking,dictationSummary,startDictation} from '../engine/listening-dictation.js';
import {answerExchange,currentExchangeQuestion,exchangeSummary,startExchangePractice} from '../engine/listening-exchange.js';
import {answerSpeakingPractice,currentSpeakingQuestion,speakingPracticeFeedback,speakingPracticeSummary,speakingPracticeSummaryCopy,startSpeakingPractice} from '../engine/speaking-practice.js';
import {answerControlledDialogue,controlledDialogueSummary,currentDialogueTurn,startControlledDialogue} from '../engine/controlled-dialogue.js';
import {SPEAKING_MAX_RECORDING_MS} from '../engine/speaking-budget.js';
import {transcribeSpokenAnswer} from '../engine/speaking-transcription.js';
const el=document.querySelector('#content'),message=document.querySelector('#system-message');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let content,state,repo,view='curriculum',dev=false,selectedConcept=null,lastFeedback=null,skipProofGate=false;
let listeningSession=null,listeningRun=0,discriminationSession=null,discriminationRun=0,missingWordSession=null,missingWordRun=0,dictationSession=null,dictationRun=0,exchangeSession=null,exchangeRun=0;
let speakingSession=null,speakingRun=0,speakingCapture=null;
let dialogueSession=null;
function abandonSpeakingCapture(){
 const capture=speakingCapture;
 speakingCapture=null;
 if(!capture)return;
 capture.abandoned=true;
 clearTimeout(capture.stopTimer);
 try{capture.stream?.getTracks?.().forEach(track=>track.stop());}catch{}
 try{if(capture.recorder?.state==='recording')capture.recorder.stop();}catch{}
}
let disposePeek=()=>{};
let coursePane='path',courseDays=30,courseCohort='all',courseConcept=null,courseCohortTouched=false;
const now=()=>dev&&state?.settings?.debugDate?new Date(state.settings.debugDate+'T12:00:00'):new Date();
function notify(t){
 message.innerHTML=t?`<div class="error-message">${esc(t)}</div>`:'';
 el.querySelector('.session-error')?.remove();
 if(t&&document.body.classList.contains('session-active')){
  const card=el.querySelector('.session .question-card');
  if(card)(card.querySelector('.actions')||card).insertAdjacentHTML(card.querySelector('.actions')?'beforebegin':'afterbegin',`<div class="error-message session-error" role="alert">${esc(t)}</div>`);
 }
}
function canListenNow(){return !!state?.settings?.listening&&(canUseServerListen()||!!dutchVoice());}
function button(id,label,primary=true,disabled=false){return `<button id="${id}" class="${primary?'primary':'secondary'}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
function on(id,fn){document.getElementById(id)?.addEventListener('click',()=>{try{const result=fn();if(result&&typeof result.then==='function')result.catch(e=>notify(e.message));}catch(e){notify(e.message);}});}
async function transaction(fn){
 const run=async()=>{const next=repo.load();const result=fn(next);repo.save(next);state=next;return result};
 // Web Locks serialise writes from tabs on this origin. Fallback stays functional in older browsers.
 if(navigator.locks)return navigator.locks.request(dev?STORAGE_KEY+'-sandbox':STORAGE_KEY,run);
 return run();
}
function proofReport(){
 const r=state.lastProof;if(!r)return '';
 const recovery=masteryRecovery(state,content,r);
 const retakeWaiting=r.type==='mastery'&&!r.passed&&phase(state.progress[r.concept],dayKey(now()))!=='proof-ready';
 const retakeReady=r.type==='mastery'&&!r.passed&&dailyProofOffer(state,content,now())?.canStartToday;
 const patterns=recovery?.groups.length?`<div class="mastery-patterns"><h3>Patterns to revisit</h3><ul>${recovery.groups.slice(0,3).map(group=>`<li><strong>${esc(group.direction==='nl-en'?'Understand the meaning':'Write the Dutch')} · ${esc(group.label)}${group.count>1?` (${group.count})`:''}</strong><span lang="nl">${esc(group.sentence)}</span><span>${esc(group.meaning)}</span><p>${esc(group.tip)}</p></li>`).join('')}</ul>${recovery.groups.length>3?`<p class="small muted">${recovery.groups.length-3} more pattern ${recovery.groups.length===4?'is':'are'} recorded in Mistakes & weak areas.</p>`:''}</div>`:'';
 const route=recovery?.failures>=2?'Choose practice for a simpler step using familiar sentences before another full retake. It uses the normal daily 20.':'Practice will revisit these patterns in different sentences. A full retake can start from your next study day if enough fresh sentences and all 20 questions are available.';
 return `<article class="card evidence-card proof-report"><div class="eyebrow">Latest ${esc(r.type)} result · ${esc(r.concept)}</div><h2>${r.passed?'Grammar proven in both directions':r.type==='mastery'?retakeReady?'Mastery retake ready':retakeWaiting?'Retake from next study day':'More practice before the retake':'More practice before the next test'}</h2><p>NL → EN: ${r.directions['nl-en'].correct}/${r.directions['nl-en'].total} · EN → NL: ${r.directions['en-nl'].correct}/${r.directions['en-nl'].total}</p>${patterns}<p class="muted small">${r.passed?(r.type==='mastery'?'The next topic’s lesson and practice may begin while you wait. This topic is not retained yet. Its retention test can open from '+esc(state.progress[r.concept].retentionDue)+' if ten fresh sentences and ten daily questions are available.':'The next concept is unlocked. This one will return for maintenance.'):r.type==='mastery'?retakeReady?'Start the retake before ordinary practice so all 20 questions are available. '+esc(route):retakeWaiting?esc(route):esc(dailyProofOffer(state,content,now())?.reason||route):'Complete eight successful practice questions before trying fresh proof material again.'}</p></article>`;
}
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
async function show(v){abandonSpeakingCapture();speakingSession=null;view=v;selectedConcept=null;lastFeedback=null;skipProofGate=false;if(v==='curriculum')coursePane='path';if(v==='evidence')coursePane='evidence';await transaction(s=>ensureDay(s,now()));render();}
function proofAction(id,offer=dailyProofOffer(state,content,now())){const p=state.progress[id],ph=phase(p,dayKey(now()));
 if(ph==='proof-ready'||ph==='retention-ready'){
 const type=ph==='proof-ready'?'mastery':'retention',reason=offer&&offer.id===id?offer.reason:null,hideButton=offer?.canStartToday&&offer.id===id;
 const rules=`${type==='mastery'?'10 unseen Dutch → English and 10 unseen typed English → Dutch. Pass with 19/20 grammar overall and at least 9/10 in each direction.':'5 unseen Dutch → English and 5 unseen typed English → Dutch. Retention requires 10/10 grammar.'} No word help.`;
 if(reason)return `<details class="rule"><summary>How the ${type} test works</summary><p class="small">${rules}</p></details>`;
 return `<div class="rule"><strong>${type==='mastery'?'Mastery test available today':'Retention test available today'}</strong>${hideButton?'':button('proof',type==='mastery'?'Start Mastery Test':'Start Retention Test',true)}<details><summary>How this test works</summary><p class="small">${rules}</p></details></div>`;
 }
 if(ph==='retention-wait')return `<details class="rule"><summary>How the retention test works</summary><p class="small">The three-day wait ends ${esc(p.retentionDue)}. The test then needs ten fresh sentences and ten unused daily questions. Retention requires 10/10 grammar.</p></details>`;
 const failedMastery=p.proofHistory?.at(-1)?.type==='mastery'&&p.proofHistory.at(-1).passed===false;
 return `<p class="muted small">${p.masteredAt?'Retained and in maintenance.':failedMastery?'Your mastery retake can start from your next study day once fresh test sentences and all 20 daily questions are available. You can practise today.':`Proof opens after 40 practice attempts. Independent production is tracked separately.${p.remedial?' '+p.remedial+' successful remedial questions remain.':''}`}</p>`;
}
function bindProof(id){on('proof',()=>proofPreparation(id));}
function vocabularyFor(id){return [...new Map(content.sentences.filter(x=>x.concept===id).flatMap(x=>x.vocabulary).map(w=>[w.id,w])).values()]}
function vocabularyHTML(words){return `<div class="vocabulary-list">${words.map(w=>`<div class="row"><strong lang="nl">${esc(w.nl)}</strong><span>${esc(w.en)}${w.mature?' <span class="pill">Mature card</span>':''}</span></div>`).join('')}</div>`}
function renderLesson(id,continueSession){
 sessionChrome(true);
 const c=content.conceptById[id];if(!unlocked(c,state))return;
 const material=lessonMaterial(content,id);
 el.innerHTML=`<section class="session stack"><article class="card question-card lesson-card"><div class="lesson-body"><span class="direction">Teach · not scored</span><h2>${esc(id)} · ${esc(c.title)}</h2><p>${esc(c.rule)}</p><div class="teach-panel"><div class="prompt" lang="nl">${esc(c.example)}</div><p>${esc(c.translation)}</p>${button('listen-example','Listen to the example',false)}</div><h3>What to notice</h3><ul class="lesson-focus">${material.focus.map(point=>`<li>${esc(point)}</li>`).join('')}</ul>${material.examples.length?`<h3>See it in another sentence</h3><div class="lesson-examples">${material.examples.map(example=>`<div><strong lang="nl">${esc(example.nl)}</strong><span>${esc(example.en)}</span></div>`).join('')}</div>`:''}<details><summary>Vocabulary for this concept</summary>${vocabularyHTML(vocabularyFor(id))}</details></div><div class="actions">${button('learned',continueSession?'Got it — let’s practise':'Back to the path')}</div></article></section>`;
 transaction(s=>teachConcept(s,id,content,{acknowledge:false})).catch(e=>notify(e.message));on('listen-example',()=>speak(c.example,notify));on('learned',async()=>{if(!continueSession){await show('curriculum');return;}await transaction(s=>teachConcept(s,id,content));await openQuestion();});
 refreshChrome();
}
async function proofPreparation(id){
 sessionChrome(true);
 const type=phase(state.progress[id],dayKey(now()))==='proof-ready'?'mastery':'retention';
 const words=vocabularyFor(id).filter(w=>!w.supportOnly&&!state.words[w.id]?.taughtAt);
 if(words.length){
  el.innerHTML=`<section class="session stack"><article class="card question-card session-briefing"><span class="direction">Vocabulary reminder · not scored</span><h2>Before your ${type} test</h2><p>Here is the remaining vocabulary for this concept. The test uses unseen sentences, with no assistance once it starts.</p>${vocabularyHTML(words)}<div class="actions">${button('begin-proof','Ready — start the test')}${button('cancel-proof','Back to the path',false)}</div></article></section>`;
  on('begin-proof',async()=>{await transaction(s=>{releaseUnscoredPractice(s);for(const w of words)markWordsTaught(s,{vocabulary:[w]},dayKey(now()));startProof(s,content,id,type,now())});await openQuestion()});on('cancel-proof',()=>show('curriculum'));
  refreshChrome();
 }else{await transaction(s=>{releaseUnscoredPractice(s);startProof(s,content,id,type,now())});await openQuestion();}
}
function renderProofGate(offer){
 sessionChrome(true);
 const title=offer.type==='mastery'?'Mastery Test':'Retention Test';
 const recovery=state.lastProof?.concept===offer.id?masteryRecovery(state,content):null;
 el.innerHTML=`<section class="session stack"><article class="card question-card"><span class="direction">${esc(offer.id)} · ready today</span><h2>Take the ${title} before practice</h2><p>This test uses ${offer.needed} of today’s 20 questions. Practising first uses the day, and the test then waits until tomorrow.</p>${recovery?.failures>=2?'<p class="tipbox">Choose Practice anyway for a simpler step on a missed pattern using a familiar sentence. It uses today’s questions; the full retake remains available on a later study day.</p>':''}<div class="actions">${button('gate-proof','Start '+title)}${button('gate-practice','Practice anyway',false)}</div></article></section>`;
 on('gate-proof',async()=>{
  const start=document.getElementById('gate-proof');
  start.disabled=true;start.textContent='Starting test…';
  try{await proofPreparation(offer.id)}catch(error){start.disabled=false;start.textContent='Start '+title;throw error;}
 });
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
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${summary.heardCorrect} of ${summary.heard} heard answers correct</h2><p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'sentence used':'sentences used'} the visible-text fallback (${summary.audioUnclear} unclear · ${summary.audioUnavailable} unavailable). ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was completed from audio without revealing the sentence.'}</p>${summary.audioIssues.length?`<div class="rule"><strong>Audio to review</strong><ul>${summary.audioIssues.map(issue=>`<li><span class="pill">${esc(issue.issue)}</span> <span lang="nl">${esc(issue.audio)}</span> — ${esc(issue.meaning)}</li>`).join('')}</ul></div>`:''}<p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-listening-practice','Practise another 5')}${button('leave-listening-practice','Back to Course',false)}</div></article></section>`;
  on('repeat-listening-practice',beginListeningPractice);on('leave-listening-practice',()=>{listeningSession=null;goHome()});return;
 }
 const audioText=q.audio,correctMeaning=q.answer;let raw='',usedTextFallback=false,audioIssue=null,locked=false;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${listeningSession.index+1} of ${listeningSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card listening-practice-card"><span class="direction">Dutch audio → English meaning</span><div class="q-type">Listen and choose the meaning</div><h2 class="prompt">Listen, then choose the meaning.</h2>${button('practice-play','Play Dutch audio',false)}<div class="row"><button id="practice-audio-unclear" class="text-link">Audio unclear</button><button id="practice-audio-unavailable" class="text-link">Audio unavailable</button></div><div id="practice-visible-text"></div><div id="answer-area"><div class="answers">${q.options.map((option,index)=>`<button class="choice" data-practice-choice="${index}" aria-pressed="false">${esc(option)}</button>`).join('')}</div></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-listening-practice','Check answer')}</div></article><button id="leave-listening-practice" class="text-link">Leave practice — no Course progress to save</button></section>`;
 const area=document.getElementById('answer-area');area.querySelectorAll('[data-practice-choice]').forEach(choice=>choice.onclick=()=>{raw=q.options[Number(choice.dataset.practiceChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))})});
 const play=document.getElementById('practice-play');prepareSpeech(audioText);
 on('practice-play',()=>{play.disabled=true;play.setAttribute('aria-busy','true');play.textContent='Loading Dutch audio…';const audioError=message=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Try Dutch audio again';notify(message)};speak(audioText,audioError,{onStart:()=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Playing… tap to replay'},onEnd:()=>{play.textContent='Play Dutch audio again'}})});
 const revealForAudioIssue=issue=>{usedTextFallback=true;audioIssue=issue;discardPreparedSpeech(audioText);play.textContent='Retry with fresh Dutch audio';document.getElementById('practice-visible-text').innerHTML=`<p class="audio-issue-sentence" lang="nl">${esc(audioText)}</p><p class="small muted">Marked ${issue}. Choose the meaning below, then Check answer to continue. This counts only as recognition.</p>`;document.getElementById('practice-audio-unclear').disabled=true;document.getElementById('practice-audio-unavailable').disabled=true;document.getElementById('answer-area').scrollIntoView({block:'nearest'});};
 on('practice-audio-unclear',()=>revealForAudioIssue('unclear'));on('practice-audio-unavailable',()=>revealForAudioIssue('unavailable'));
 on('check-listening-practice',()=>{if(locked)return;if(!raw){notify('Choose an answer first.');return;}locked=true;const next=answerListeningPractice(listeningSession,raw,{usedTextFallback,audioIssue});const result=next.answers.at(-1);listeningSession=next;const upcoming=currentListeningQuestion(listeningSession);if(upcoming)prepareSpeech(upcoming.audio);el.querySelectorAll('button').forEach(button=>button.disabled=true);document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?'Meaning understood':'Not this time'}</strong><span class="correct" lang="nl">${esc(audioText)}</span><span class="meaning">${esc(correctMeaning)}</span><div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening diagnostic'}</span>${audioIssue?`<span class="badge">Audio ${esc(audioIssue)}</span>`:''}<span class="badge">Does not change progress</span></div></div>`;document.querySelector('.actions').innerHTML=button('next-listening-practice',upcoming?'Continue':'View listening summary');on('next-listening-practice',renderListeningPractice);document.getElementById('next-listening-practice').focus();});
 on('leave-listening-practice',()=>{listeningSession=null;goHome()});
}
function beginDiscrimination(conceptId){
 try{discriminationRun++;listeningSession=null;discriminationSession=startSentenceDiscrimination(state,content,{conceptId,seed:`${dayKey(now())}:${state.learnerId}:${conceptId}:${discriminationRun}`});renderDiscrimination();}catch(e){notify(e.message)}
}
function renderDiscrimination(){
 sessionChrome(true);notify('');
 const question=currentDiscriminationQuestion(discriminationSession);
 if(!question){
  const summary=discriminationSummary(discriminationSession);
  const heading=summary.heard?`${summary.heardCorrect} of ${summary.heard} heard answers matched`:'No answers were completed from audio';
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${heading}</h2><p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'sentence used':'sentences used'} the visible-text fallback (${summary.audioUnclear} unclear · ${summary.audioUnavailable} unavailable). ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was completed from audio without revealing the sentence.'}</p>${summary.audioIssues.length?`<div class="rule"><strong>Audio to review</strong><ul>${summary.audioIssues.map(issue=>`<li><span class="pill">${esc(issue.issue)}</span> <span lang="nl">${esc(issue.audio)}</span> — ${esc(issue.meaning)}</li>`).join('')}</ul></div>`:''}${summary.slowed?`<p>${summary.slowed} ${summary.slowed===1?'answer was':'answers were'} given after a slower replay. That counts as supported listening.</p>`:''}<p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-discrimination','Practise this listening again')}${button('leave-discrimination','Back to the topic',false)}</div></article></section>`;
  on('repeat-discrimination',()=>beginDiscrimination(discriminationSession.conceptId));on('leave-discrimination',()=>{const conceptId=discriminationSession?.conceptId;discriminationSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();});return;
 }
 const audioText=question.audio,correctMeaning=question.meaning;let raw='',slowed=false,usedTextFallback=false,audioIssue=null,locked=false;
 const dutchChoices=`<div class="answers" role="group" aria-label="Dutch sentences you might have heard">${question.options.map((option,index)=>`<button type="button" class="choice" data-discrimination-choice="${index}" aria-pressed="false" lang="nl">${esc(option)}</button>`).join('')}</div>`;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${discriminationSession.index+1} of ${discriminationSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card listening-practice-card"><span class="direction">Dutch audio → Dutch sentence</span><div class="q-type">Listen and choose the sentence</div><h2 class="prompt">Listen, then choose the Dutch sentence you heard.</h2>${button('discrimination-play','Play Dutch audio',false)}<div class="row"><button id="discrimination-play-slower" class="text-link" type="button">Play slower</button></div><div class="row"><button id="discrimination-audio-unclear" class="text-link" type="button">Audio unclear</button><button id="discrimination-audio-unavailable" class="text-link" type="button">Audio unavailable</button></div><div id="discrimination-visible-text"></div><div id="answer-area">${dutchChoices}</div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-discrimination','Check answer')}</div></article><button id="leave-discrimination" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const bindChoices=()=>{
  const area=document.getElementById('answer-area');
  area.querySelectorAll('[data-discrimination-choice]').forEach(choice=>choice.onclick=()=>{const options=usedTextFallback?question.meaningOptions:question.options;raw=options[Number(choice.dataset.discriminationChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))});});
 };
 bindChoices();
 const play=document.getElementById('discrimination-play');prepareSpeech(audioText);
 const playAt=rate=>{play.disabled=true;play.setAttribute('aria-busy','true');play.textContent='Loading Dutch audio…';const audioError=message=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Try Dutch audio again';notify(message)};speak(audioText,audioError,{rate,onStart:()=>{if(rate!==1&&!usedTextFallback&&!locked)slowed=true;play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Playing… tap to replay'},onEnd:()=>{play.textContent='Play Dutch audio again'}})};on('discrimination-play',()=>playAt(1));on('discrimination-play-slower',()=>playAt(SLOWER_RATE));
 const revealForAudioIssue=issue=>{
  usedTextFallback=true;audioIssue=issue;raw='';discardPreparedSpeech(audioText);play.textContent='Retry with fresh Dutch audio';
  document.getElementById('discrimination-visible-text').innerHTML=`<p class="audio-issue-sentence" lang="nl">${esc(audioText)}</p><p class="small muted">Marked ${esc(issue)}. The Dutch sentence is shown above. Choose its English meaning, then Check answer. This counts only as recognition, not listening.</p>`;
  document.getElementById('answer-area').innerHTML=`<div class="answers" role="group" aria-label="English meanings">${question.meaningOptions.map((option,index)=>`<button type="button" class="choice" data-discrimination-choice="${index}" aria-pressed="false">${esc(option)}</button>`).join('')}</div>`;
  bindChoices();
  document.getElementById('discrimination-audio-unclear').disabled=true;document.getElementById('discrimination-audio-unavailable').disabled=true;document.getElementById('answer-area').scrollIntoView({block:'nearest'});
 };
 on('discrimination-audio-unclear',()=>revealForAudioIssue('unclear'));on('discrimination-audio-unavailable',()=>revealForAudioIssue('unavailable'));
 on('check-discrimination',()=>{
  if(locked)return;if(!raw){notify('Choose an answer first.');return;}locked=true;
  const next=answerSentenceDiscrimination(discriminationSession,raw,{usedTextFallback,audioIssue,slowed});
  const result=next.answers.at(-1);discriminationSession=next;const upcoming=currentDiscriminationQuestion(discriminationSession);if(upcoming)prepareSpeech(upcoming.audio);
  el.querySelectorAll('button').forEach(button=>{if(button.id!=='leave-discrimination')button.disabled=true});
  const chosenMeaning=!result.correct&&!usedTextFallback?question.optionMeanings[normalize(raw)]:'';
  const contrast=chosenMeaning?`<span class="meaning">You chose: <span lang="nl">${esc(raw)}</span> — ${esc(chosenMeaning)}</span>`:'';
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?(usedTextFallback?'Meaning understood':'You heard this sentence'):'Not this time'}</strong><span class="correct" lang="nl">${esc(audioText)}</span><span class="meaning">${esc(correctMeaning)}</span>${contrast}<div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening diagnostic'}</span>${slowed&&!usedTextFallback?'<span class="badge">Heard slower</span>':''}${audioIssue?`<span class="badge">Audio ${esc(audioIssue)}</span>`:''}<span class="badge">Does not change progress</span></div></div>`;
  document.querySelector('.actions').innerHTML=`${button('replay-discrimination','Hear it again',false)}${button('replay-discrimination-slower','Hear it slower',false)}${button('next-discrimination',upcoming?'Continue':'View listening summary')}`;
  on('replay-discrimination',()=>speak(audioText,notify));on('replay-discrimination-slower',()=>speak(audioText,notify,{rate:SLOWER_RATE}));
  on('next-discrimination',renderDiscrimination);document.getElementById('feedback')?.scrollIntoView({block:'nearest'});document.getElementById('next-discrimination').focus();
 });
 on('leave-discrimination',()=>{const conceptId=discriminationSession?.conceptId;discriminationSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();});
}
function beginMissingWord(conceptId){
 try{missingWordRun++;listeningSession=null;discriminationSession=null;missingWordSession=startMissingWord(state,content,{conceptId,seed:`${dayKey(now())}:${state.learnerId}:${conceptId}:missing:${missingWordRun}`});renderMissingWord();}catch(e){notify(e.message)}
}
function leaveMissingWord(){const conceptId=missingWordSession?.conceptId;missingWordSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();}
function renderMissingWord(){
 sessionChrome(true);notify('');
 const question=currentMissingWordQuestion(missingWordSession);
 if(!question){
  const summary=missingWordSummary(missingWordSession);
  const heading=summary.heard?`${summary.heardCorrect} of ${summary.heard} heard words matched`:'No answers were completed from audio';
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${heading}</h2><p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'sentence used':'sentences used'} the visible-text fallback (${summary.audioUnclear} unclear · ${summary.audioUnavailable} unavailable). ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was completed from audio without revealing the sentence.'}</p>${summary.audioIssues.length?`<div class="rule"><strong>Audio to review</strong><ul>${summary.audioIssues.map(issue=>`<li><span class="pill">${esc(issue.issue)}</span> <span lang="nl">${esc(issue.audio)}</span> — ${esc(issue.meaning)}</li>`).join('')}</ul></div>`:''}${summary.slowed?`<p>${summary.slowed} ${summary.slowed===1?'answer was':'answers were'} given after a slower replay. That counts as supported listening.</p>`:''}<p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-missing-word','Practise this listening again')}${button('leave-missing-word','Back to the topic',false)}</div></article></section>`;
  on('repeat-missing-word',()=>beginMissingWord(missingWordSession.conceptId));on('leave-missing-word',leaveMissingWord);return;
 }
 const audioText=question.audio;let raw='',slowed=false,usedTextFallback=false,audioIssue=null,locked=false,revealed=false;
 // The gapped line and word choices appear only once the Dutch audio has started.
 const frameHTML=()=>`<p class="audio-issue-sentence missing-word-frame" lang="nl">${esc(question.frame)}</p>`;
 const choicesHTML=()=>`<div class="answers" role="group" aria-label="Words that might fill the gap">${question.options.map((option,index)=>`<button type="button" class="choice" data-missing-word-choice="${index}" aria-pressed="false" lang="nl">${esc(option)}</button>`).join('')}</div>`;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${missingWordSession.index+1} of ${missingWordSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card listening-practice-card"><span class="direction">Dutch audio → missing word</span><div class="q-type">Listen and choose the word</div><h2 class="prompt">Listen, then choose the missing word.</h2>${button('missing-word-play','Play Dutch audio',false)}<div class="row"><button id="missing-word-play-slower" class="text-link" type="button">Play slower</button></div><div class="row"><button id="missing-word-audio-unclear" class="text-link" type="button">Audio unclear</button><button id="missing-word-audio-unavailable" class="text-link" type="button">Audio unavailable</button></div><div id="missing-word-visible-text"><p class="small muted">The sentence with its gap appears when the audio starts.</p></div><div id="answer-area"></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-missing-word','Check answer')}</div></article><button id="leave-missing-word" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const bindChoices=()=>{
  const area=document.getElementById('answer-area');
  area.querySelectorAll('[data-missing-word-choice]').forEach(choice=>choice.onclick=()=>{raw=question.options[Number(choice.dataset.missingWordChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))});});
 };
 const visibleText=document.getElementById('missing-word-visible-text');
 // A late audio start from a screen already left must not change the new one.
 const revealFrame=()=>{
  if(revealed||locked||!visibleText.isConnected)return;revealed=true;
  visibleText.innerHTML=frameHTML();
  document.getElementById('answer-area').innerHTML=choicesHTML();bindChoices();
 };
 const play=document.getElementById('missing-word-play');prepareSpeech(audioText);
 const playAt=rate=>{play.disabled=true;play.setAttribute('aria-busy','true');play.textContent='Loading Dutch audio…';const audioError=message=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Try Dutch audio again';notify(message)};speak(audioText,audioError,{rate,onStart:()=>{if(rate!==1&&!usedTextFallback&&!locked)slowed=true;play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Playing… tap to replay';if(!usedTextFallback)revealFrame()},onEnd:()=>{play.textContent='Play Dutch audio again'}})};on('missing-word-play',()=>playAt(1));on('missing-word-play-slower',()=>playAt(SLOWER_RATE));
 const revealForAudioIssue=issue=>{
  if(locked)return;
  usedTextFallback=true;audioIssue=issue;revealed=true;discardPreparedSpeech(audioText);play.textContent='Retry with fresh Dutch audio';
  document.getElementById('missing-word-visible-text').innerHTML=`${frameHTML()}<p class="meaning">${esc(question.meaning)}</p><p class="small muted">Marked ${esc(issue)}. The sentence and its English meaning are shown above. Choose the missing word, then Check answer. This counts only as recognition, not listening.</p>`;
  document.getElementById('answer-area').innerHTML=choicesHTML();raw='';bindChoices();
  document.getElementById('missing-word-audio-unclear').disabled=true;document.getElementById('missing-word-audio-unavailable').disabled=true;document.getElementById('answer-area').scrollIntoView({block:'nearest'});
 };
 on('missing-word-audio-unclear',()=>revealForAudioIssue('unclear'));on('missing-word-audio-unavailable',()=>revealForAudioIssue('unavailable'));
 on('check-missing-word',()=>{
  if(locked)return;if(!raw){notify(revealed?'Choose an answer first.':'Play the Dutch audio first.');return;}locked=true;
  const next=answerMissingWord(missingWordSession,raw,{usedTextFallback,audioIssue,slowed});
  const result=next.answers.at(-1);missingWordSession=next;const upcoming=currentMissingWordQuestion(missingWordSession);if(upcoming)prepareSpeech(upcoming.audio);
  el.querySelectorAll('button').forEach(button=>{if(button.id!=='leave-missing-word')button.disabled=true});
  const words=question.sentence.trim().split(/\s+/);
  const marked=words.map((word,index)=>index===question.wordIndex?`<mark>${esc(word)}</mark>`:esc(word)).join(' ');
  const contrast=!result.correct?`<span class="meaning">You chose: <span lang="nl">${esc(raw)}</span></span>`:'';
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?(usedTextFallback?'Word recognised':'You heard the missing word'):'Not this time'}</strong><span class="correct" lang="nl">${marked}</span><span class="meaning">${esc(question.meaning)}</span>${contrast}<div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening diagnostic'}</span>${slowed&&!usedTextFallback?'<span class="badge">Heard slower</span>':''}${audioIssue?`<span class="badge">Audio ${esc(audioIssue)}</span>`:''}<span class="badge">Does not change progress</span></div></div>`;
  document.querySelector('.actions').innerHTML=`${button('replay-missing-word','Hear it again',false)}${button('replay-missing-word-slower','Hear it slower',false)}${button('next-missing-word',upcoming?'Continue':'View listening summary')}`;
  on('replay-missing-word',()=>speak(audioText,notify));on('replay-missing-word-slower',()=>speak(audioText,notify,{rate:SLOWER_RATE}));
  on('next-missing-word',renderMissingWord);document.getElementById('feedback')?.scrollIntoView({block:'nearest'});document.getElementById('next-missing-word').focus();
 });
 on('leave-missing-word',leaveMissingWord);
}
function beginDictation(conceptId){
 try{dictationRun++;listeningSession=null;discriminationSession=null;missingWordSession=null;dictationSession=startDictation(state,content,{conceptId,seed:`${dayKey(now())}:${state.learnerId}:${conceptId}:dictation:${dictationRun}`});renderDictation();}catch(e){notify(e.message)}
}
function leaveDictation(){const conceptId=dictationSession?.conceptId;dictationSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();}
function renderDictation(){
 sessionChrome(true);notify('');
 const question=currentDictationQuestion(dictationSession);
 if(!question){
  const summary=dictationSummary(dictationSession);
  const heading=summary.heard?`${summary.heardCorrect} of ${summary.heard} sentences typed exactly`:'No answers were completed from audio';
  const words=summary.heard?`${summary.wordsHeard} of ${summary.words} words heard${summary.heardNear?`; ${summary.heardNear} ${summary.heardNear===1?'sentence had':'sentences had'} only small spelling slips`:''}.`:'';
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${heading}</h2>${words?`<p>${words}</p>`:''}<p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'sentence used':'sentences used'} the visible-text fallback (${summary.audioUnclear} unclear · ${summary.audioUnavailable} unavailable). ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was typed from audio without seeing the sentence.'} Typing is listening and writing practice, not speaking evidence.</p>${summary.audioIssues.length?`<div class="rule"><strong>Audio to review</strong><ul>${summary.audioIssues.map(issue=>`<li><span class="pill">${esc(issue.issue)}</span> <span lang="nl">${esc(issue.audio)}</span> — ${esc(issue.meaning)}</li>`).join('')}</ul></div>`:''}${summary.slowed?`<p>${summary.slowed} ${summary.slowed===1?'answer was':'answers were'} given after a slower replay. That counts as supported listening.</p>`:''}<p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-dictation','Practise this listening again')}${button('leave-dictation','Back to the topic',false)}</div></article></section>`;
  on('repeat-dictation',()=>beginDictation(dictationSession.conceptId));on('leave-dictation',leaveDictation);return;
 }
 const audioText=question.audio;let raw='',slowed=false,usedTextFallback=false,audioIssue=null,locked=false,started=false;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${dictationSession.index+1} of ${dictationSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card listening-practice-card"><span class="direction">Dutch audio → typed Dutch</span><div class="q-type">Listen and type</div><h2 class="prompt">Listen, then type the Dutch sentence you heard.</h2>${button('dictation-play','Play Dutch audio',false)}<div class="row"><button id="dictation-play-slower" class="text-link" type="button">Play slower</button></div><div class="row"><button id="dictation-audio-unclear" class="text-link" type="button">Audio unclear</button><button id="dictation-audio-unavailable" class="text-link" type="button">Audio unavailable</button></div><div id="dictation-visible-text"><p class="small muted">${question.wordCount} words. You can type once the audio starts, and replay it as often as you like.</p></div><div id="answer-area"><input id="dictation-answer" class="input" lang="nl" placeholder="Play the audio first" aria-label="The Dutch sentence you heard" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" disabled></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-dictation','Check answer')}</div></article><button id="leave-dictation" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const field=document.getElementById('dictation-answer'),input=()=>field;
 // A late audio start from a screen already left must not change the new one.
 const enableTyping=()=>{
  if(started||locked||usedTextFallback||!field.isConnected)return;started=true;
  field.disabled=false;field.placeholder='Type in Dutch';
 };
 const play=document.getElementById('dictation-play');prepareSpeech(audioText);
 const playAt=rate=>{play.disabled=true;play.setAttribute('aria-busy','true');play.textContent='Loading Dutch audio…';const audioError=message=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Try Dutch audio again';notify(message)};speak(audioText,audioError,{rate,onStart:()=>{if(rate!==1&&!usedTextFallback&&!locked)slowed=true;play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Playing… tap to replay';enableTyping()},onEnd:()=>{play.textContent='Play Dutch audio again';if(!usedTextFallback&&!locked&&field.isConnected)field.focus()}})};on('dictation-play',()=>playAt(1));on('dictation-play-slower',()=>playAt(SLOWER_RATE));
 const revealForAudioIssue=issue=>{
  if(locked)return;
  usedTextFallback=true;audioIssue=issue;raw='';discardPreparedSpeech(audioText);play.textContent='Retry with fresh Dutch audio';
  document.getElementById('dictation-visible-text').innerHTML=`<p class="audio-issue-sentence" lang="nl">${esc(audioText)}</p><p class="small muted">Marked ${esc(issue)}. The Dutch sentence is shown above. Choose its English meaning, then Check answer. This counts only as recognition, not listening.</p>`;
  document.getElementById('answer-area').innerHTML=`<div class="answers" role="group" aria-label="English meanings">${question.meaningOptions.map((option,index)=>`<button type="button" class="choice" data-dictation-choice="${index}" aria-pressed="false">${esc(option)}</button>`).join('')}</div>`;
  const area=document.getElementById('answer-area');
  area.querySelectorAll('[data-dictation-choice]').forEach(choice=>choice.onclick=()=>{raw=question.meaningOptions[Number(choice.dataset.dictationChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))});});
  document.getElementById('dictation-audio-unclear').disabled=true;document.getElementById('dictation-audio-unavailable').disabled=true;area.scrollIntoView({block:'nearest'});
 };
 on('dictation-audio-unclear',()=>revealForAudioIssue('unclear'));on('dictation-audio-unavailable',()=>revealForAudioIssue('unavailable'));
 const check=()=>{
  if(locked)return;
  const answer=usedTextFallback?raw:input()?.value||'';
  if(!usedTextFallback&&!started){notify('Play the Dutch audio first.');return;}
  if(!answer.trim()){notify(usedTextFallback?'Choose an answer first.':'Type what you heard first.');return;}
  locked=true;
  const next=answerDictation(dictationSession,answer,{usedTextFallback,audioIssue,slowed});
  const result=next.answers.at(-1);dictationSession=next;const upcoming=currentDictationQuestion(dictationSession);if(upcoming)prepareSpeech(upcoming.audio);
  el.querySelectorAll('button,input').forEach(control=>{if(control.id!=='leave-dictation')control.disabled=true});
  let body;
  if(usedTextFallback){
   body=`<strong>${result.correct?'Meaning understood':'Not this time'}</strong><span class="correct" lang="nl">${esc(audioText)}</span><span class="meaning">${esc(question.meaning)}</span>`;
  }else{
   const marking=dictationMarking(answer,question.answer);
   const marked=marking.words.map(word=>word.status==='heard'?esc(word.text):word.status==='spelling'?`<span class="dictation-spelling">${esc(word.text)}</span>`:`<mark>${esc(word.text)}</mark>`).join(' ');
   const slips=marking.words.filter(word=>word.status==='spelling').map(word=>`<span lang="nl">${esc(word.typed)}</span> → <span lang="nl">${esc(word.text)}</span>`);
   const missed=marking.words.filter(word=>word.status==='missed').map(word=>`<span lang="nl">${esc(word.text)}</span>`);
   const notes=[slips.length?`Spelling: ${slips.join(', ')}.`:'',missed.length?`Not heard: ${missed.join(', ')}.`:'',marking.extra.length?`Not in the sentence: ${marking.extra.map(word=>`<span lang="nl">${esc(word)}</span>`).join(', ')}.`:''].filter(Boolean);
   body=`<strong>${result.correct?'Every word heard':result.near?'Every word heard — check the spelling':'Not quite'}</strong><span class="correct" lang="nl">${marked}</span><span class="meaning">${esc(question.meaning)}</span><span class="meaning">You typed: <span lang="nl">${esc(answer)}</span></span>${notes.map(note=>`<span class="meaning">${note}</span>`).join('')}`;
  }
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}">${body}<div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening and writing'}</span>${slowed&&!usedTextFallback?'<span class="badge">Heard slower</span>':''}${usedTextFallback?'':'<span class="badge">Not speaking evidence</span>'}${audioIssue?`<span class="badge">Audio ${esc(audioIssue)}</span>`:''}<span class="badge">Does not change progress</span></div></div>`;
  document.querySelector('.actions').innerHTML=`${button('replay-dictation','Hear it again',false)}${button('replay-dictation-slower','Hear it slower',false)}${button('next-dictation',upcoming?'Continue':'View listening summary')}`;
  on('replay-dictation',()=>speak(audioText,notify));on('replay-dictation-slower',()=>speak(audioText,notify,{rate:SLOWER_RATE}));
  on('next-dictation',renderDictation);document.getElementById('feedback')?.scrollIntoView({block:'nearest'});document.getElementById('next-dictation').focus();
 };
 on('check-dictation',check);
 input().addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();check();}});
 on('leave-dictation',leaveDictation);
}
function beginExchange(conceptId){
 try{exchangeRun++;listeningSession=null;discriminationSession=null;missingWordSession=null;dictationSession=null;exchangeSession=startExchangePractice(state,{conceptId,seed:`${dayKey(now())}:${state.learnerId}:${conceptId}:exchange:${exchangeRun}`});renderExchange();}catch(e){notify(e.message)}
}
function leaveExchange(){const conceptId=exchangeSession?.conceptId;exchangeSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();}
function renderExchange(){
 sessionChrome(true);notify('');
 const question=currentExchangeQuestion(exchangeSession);
 if(!question){
  const summary=exchangeSummary(exchangeSession);
  const heading=summary.heard?`${summary.heardCorrect} of ${summary.heard} heard exchanges understood`:'No answers were completed from audio';
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL LISTENING PRACTICE</div><h2>${heading}</h2><p>${summary.textFallbacks?`${summary.textFallbacks} ${summary.textFallbacks===1?'exchange used':'exchanges used'} the visible-text fallback (${summary.audioUnclear} unclear · ${summary.audioUnavailable} unavailable). ${summary.textFallbacks===1?'That answer is':'Those answers are'} recognition practice, not listening evidence.`:'Every answer was completed from audio without reading the exchange.'} Listening to an exchange is not taking part in one, so this is not speaking or conversation evidence.</p>${summary.audioIssues.length?`<div class="rule"><strong>Audio to review</strong><ul>${summary.audioIssues.map(issue=>`<li><span class="pill">${esc(issue.issue)}</span> <span lang="nl">${esc(issue.audio)}</span></li>`).join('')}</ul></div>`:''}<p class="muted">No Course, mastery, or retention progress changed. This session-only result is not added to your permanent learning record.</p><div class="actions">${button('repeat-exchange','Practise this listening again')}${button('leave-exchange','Back to the topic',false)}</div></article></section>`;
  on('repeat-exchange',()=>beginExchange(exchangeSession.conceptId));on('leave-exchange',leaveExchange);return;
 }
 const audioText=question.audio;let raw='',usedTextFallback=false,audioIssue=null,locked=false,revealed=false;
 const turnsHTML=()=>`<div class="exchange-turns">${question.turns.map((turn,index)=>`<p><span class="pill">${index?'B':'A'}</span> <span lang="nl">${esc(turn.nl)}</span></p>`).join('')}</div>`;
 const choicesHTML=()=>`<div class="answers" role="group" aria-label="What was said">${question.options.map((option,index)=>`<button type="button" class="choice" data-exchange-choice="${index}" aria-pressed="false">${esc(option)}</button>`).join('')}</div>`;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Listening ${exchangeSession.index+1} of ${exchangeSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card listening-practice-card"><span class="direction">Dutch exchange → meaning</span><div class="q-type">Listen to two people</div><h2 class="prompt">Listen to the short exchange, then choose what was said.</h2>${button('exchange-play','Play Dutch audio',false)}<div class="row"><button id="exchange-audio-unclear" class="text-link" type="button">Audio unclear</button><button id="exchange-audio-unavailable" class="text-link" type="button">Audio unavailable</button></div><div id="exchange-visible-text"><p class="small muted">Two short turns: a question, then a reply. The choices appear when the audio starts.</p></div><div id="answer-area"></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-exchange','Check answer')}</div></article><button id="leave-exchange" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const visibleText=document.getElementById('exchange-visible-text'),area=document.getElementById('answer-area');
 const bindChoices=()=>{
  area.querySelectorAll('[data-exchange-choice]').forEach(choice=>choice.onclick=()=>{raw=question.options[Number(choice.dataset.exchangeChoice)];area.querySelectorAll('button').forEach(button=>{button.classList.toggle('selected',button===choice);button.setAttribute('aria-pressed',String(button===choice))});});
 };
 // A late audio start from a screen already left must not change the new one.
 const revealChoices=()=>{
  if(revealed||locked||!area.isConnected)return;revealed=true;
  visibleText.innerHTML='';area.innerHTML=choicesHTML();bindChoices();
 };
 const play=document.getElementById('exchange-play');prepareSpeech(audioText);
 on('exchange-play',()=>{play.disabled=true;play.setAttribute('aria-busy','true');play.textContent='Loading Dutch audio…';const audioError=message=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Try Dutch audio again';notify(message)};speak(audioText,audioError,{onStart:()=>{play.disabled=false;play.removeAttribute('aria-busy');play.textContent='Playing… tap to replay';if(!usedTextFallback)revealChoices()},onEnd:()=>{play.textContent='Play Dutch audio again'}})});
 const revealForAudioIssue=issue=>{
  if(locked)return;
  usedTextFallback=true;audioIssue=issue;revealed=true;raw='';discardPreparedSpeech(audioText);play.textContent='Retry with fresh Dutch audio';
  visibleText.innerHTML=`${turnsHTML()}<p class="small muted">Marked ${esc(issue)}. The exchange is shown above. Choose what was said, then Check answer. This counts only as recognition, not listening.</p>`;
  area.innerHTML=choicesHTML();bindChoices();
  document.getElementById('exchange-audio-unclear').disabled=true;document.getElementById('exchange-audio-unavailable').disabled=true;area.scrollIntoView({block:'nearest'});
 };
 on('exchange-audio-unclear',()=>revealForAudioIssue('unclear'));on('exchange-audio-unavailable',()=>revealForAudioIssue('unavailable'));
 on('check-exchange',()=>{
  if(locked)return;if(!raw){notify(revealed?'Choose an answer first.':'Play the Dutch audio first.');return;}locked=true;
  const next=answerExchange(exchangeSession,raw,{usedTextFallback,audioIssue});
  const result=next.answers.at(-1);exchangeSession=next;const upcoming=currentExchangeQuestion(exchangeSession);if(upcoming)prepareSpeech(upcoming.audio);
  el.querySelectorAll('button').forEach(button=>{if(button.id!=='leave-exchange')button.disabled=true});
  const contrast=!result.correct?`<span class="meaning">You chose: ${esc(raw)}</span>`:'';
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?(usedTextFallback?'Meaning understood':'You followed the exchange'):'Not this time'}</strong>${question.turns.map((turn,index)=>`<span class="correct"><span class="pill">${index?'B':'A'}</span> <span lang="nl">${esc(turn.nl)}</span></span><span class="meaning">${esc(turn.en)}</span>`).join('')}${contrast}<div class="badges"><span class="badge">${usedTextFallback?'Recognition only':'Listening diagnostic'}</span><span class="badge">Not conversation evidence</span>${audioIssue?`<span class="badge">Audio ${esc(audioIssue)}</span>`:''}<span class="badge">Does not change progress</span></div></div>`;
  document.querySelector('.actions').innerHTML=`${button('replay-exchange','Hear it again',false)}${button('next-exchange',upcoming?'Continue':'View listening summary')}`;
  on('replay-exchange',()=>speak(audioText,notify));
  on('next-exchange',renderExchange);document.getElementById('feedback')?.scrollIntoView({block:'nearest'});document.getElementById('next-exchange').focus();
 });
 on('leave-exchange',leaveExchange);
}
function beginSpeakingPractice(conceptId=selectedConcept){
 try{
  abandonSpeakingCapture();
  speakingRun++;
  speakingSession=startSpeakingPractice(state,content,{conceptId,seed:`${dayKey(now())}:${state.learnerId}:${conceptId}:${speakingRun}`});
  renderSpeakingPractice();
 }catch(e){notify(e.message)}
}
function renderSpeakingPractice(){
 if(!speakingSession){goHome();return;}
 sessionChrome(true);notify('');
 const question=currentSpeakingQuestion(speakingSession);
 if(!question){
  abandonSpeakingCapture();
  const summary=speakingPracticeSummary(speakingSession);
  const copy=speakingPracticeSummaryCopy(summary);
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL SPEAKING PRACTICE</div><h2>${esc(copy.heading)}</h2><p>${esc(copy.typed)}</p>${copy.speech?`<p>${esc(copy.speech)}</p>`:''}${summary.spoken?'<p>This checks the words that were transcribed. It is not a pronunciation score.</p>':''}<p class="muted">${esc(copy.note)}</p><div class="actions">${button('repeat-speaking-practice','Practise this speaking again')}${button('leave-speaking-practice','Back to the topic',false)}</div></article></section>`;
  on('repeat-speaking-practice',()=>beginSpeakingPractice(speakingSession.conceptId));
  on('leave-speaking-practice',()=>{const conceptId=speakingSession?.conceptId;abandonSpeakingCapture();speakingSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();});
  return;
 }
 renderSpeakingTurn(question,{retried:false});
}

function beginControlledDialogue(conceptId=selectedConcept){
 try{dialogueSession=startControlledDialogue(state,{conceptId});renderControlledDialogue();}catch(e){notify(e.message)}
}
function leaveControlledDialogue(){const conceptId=dialogueSession?.conceptId;dialogueSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();}
function renderControlledDialogue(){
 if(!dialogueSession){goHome();return;}
 sessionChrome(true);notify('');
 const turn=currentDialogueTurn(dialogueSession);
 if(!turn){
  const summary=controlledDialogueSummary(dialogueSession),response=dialogueSession.responses.at(-1);
  const heading=summary.appropriate===summary.total?'You completed the exchange':'You finished the exchange';
  const badge=response?.correct?(response.support==='independent'?'Independent interaction':'Supported interaction'):'Response to revisit';
  el.innerHTML=`<section class="session stack"><article class="card evidence-card complete"><div class="bigcheck">✓</div><div class="eyebrow">OPTIONAL INTERACTION PRACTICE</div><h2>${esc(heading)}</h2><div class="exchange-turns"><p><span class="pill">Partner</span> <span lang="nl">${esc(dialogueSession.dialogue.turns[0].partner.nl)}</span></p><p><span class="pill">You</span> <span lang="nl">${esc(response?.answer||'')}</span></p></div><div class="badges"><span class="badge">${esc(badge)}</span>${response?.repaired?'<span class="badge">Repaired after a retry</span>':''}<span class="badge">Does not change progress</span></div><p class="muted">This is a session-only interaction diagnostic. It did not use today’s 20 or change Course, mastery, retention, or saved learner history.</p><div class="actions">${button('repeat-controlled-dialogue','Practise this exchange again')}${button('leave-controlled-dialogue','Back to the topic',false)}</div></article></section>`;
  on('repeat-controlled-dialogue',()=>beginControlledDialogue(dialogueSession.conceptId));on('leave-controlled-dialogue',leaveControlledDialogue);return;
 }
 let raw='',usedClarify=false,usedPhraseSupport=false,locked=false;
 const dialogue=dialogueSession.dialogue;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Short exchange</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card dialogue-practice-card"><span class="direction">Dutch interaction</span><div class="q-type">${esc(dialogue.title)}</div><p>${esc(dialogue.situation)}</p><div class="exchange-turns"><p><span class="pill">Partner</span> <strong lang="nl">${esc(turn.partner.nl)}</strong></p></div><div class="row"><button id="repeat-dialogue-turn" class="text-link" type="button">Repeat</button><button id="clarify-dialogue-turn" class="text-link" type="button">Clarify</button><button id="support-dialogue-turn" class="text-link" type="button">Phrase support</button></div><div id="dialogue-support" aria-live="polite"></div><label for="dialogue-answer" class="sr-only">Your Dutch reply</label><input id="dialogue-answer" class="input" lang="nl" placeholder="Reply in Dutch" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false"><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-controlled-dialogue',dialogueSession.repair?'Try the repair':'Check reply')}</div></article><button id="leave-controlled-dialogue" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const input=document.getElementById('dialogue-answer');input.oninput=()=>raw=input.value;
 on('repeat-dialogue-turn',()=>speak(turn.partner.nl,notify));
 on('clarify-dialogue-turn',()=>{usedClarify=true;document.getElementById('dialogue-support').innerHTML=`<p class="tipbox"><strong>Meaning:</strong> ${esc(turn.partner.en)}</p>`;});
 on('support-dialogue-turn',()=>{usedPhraseSupport=true;document.getElementById('dialogue-support').innerHTML=`<p class="tipbox"><strong>Start with:</strong> ${turn.phraseHints.map(esc).join(' &nbsp;or&nbsp; ')}</p>`;});
 const check=()=>{
  if(locked)return;if(!raw.trim()){notify('Type a Dutch reply first.');return;}
  const next=answerControlledDialogue(dialogueSession,raw,{usedClarify,usedPhraseSupport});
  if(next.repair){dialogueSession=next;renderControlledDialogue();notify('That reply does not fit this phone problem yet. Try the turn once more, or use phrase support.');document.getElementById('dialogue-answer')?.focus();return;}
  locked=true;dialogueSession=next;const result=next.responses.at(-1);
  el.querySelectorAll('input,button').forEach(control=>{if(control.id!=='leave-controlled-dialogue')control.disabled=true});
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':'bad'}"><strong>${result.correct?(result.repaired?'Repair worked':'That response fits'):'Not this time'}</strong><span class="meaning">${result.correct?'More than one Dutch response can work here.':'A fitting reply could be:'}</span>${turn.accepted.map(option=>`<span class="correct" lang="nl">${esc(option.nl)}</span><span class="meaning">${esc(option.en)}</span>`).join('')}<div class="badges"><span class="badge">${result.correct?(result.support==='independent'?'Interaction diagnostic':'Supported interaction'):'Needs more practice'}</span><span class="badge">Does not change progress</span></div></div>`;
  document.querySelector('.actions').innerHTML=button('finish-controlled-dialogue','View dialogue summary');on('finish-controlled-dialogue',renderControlledDialogue);document.getElementById('finish-controlled-dialogue')?.focus();
 };
 on('check-controlled-dialogue',check);input.onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();check();}};on('leave-controlled-dialogue',leaveControlledDialogue);input.focus();
}
function renderSpeakingTurn(question,{retried=false}={}){
 let raw='',typedFallback=false,speechIssue=null,locked=false;
 const prompt=question.prompt;
 el.innerHTML=`<section class="session"><div class="session-head"><strong>Speaking ${speakingSession.index+1} of ${speakingSession.questions.length}</strong><span class="pill">Optional Practice</span></div><p class="muted small">Session-only diagnostic. This does not use today’s 20.</p><article class="card question-card speaking-practice-card"><span class="direction">English → Dutch</span><div class="q-type">Say the Dutch sentence</div><h2 class="prompt">${esc(prompt)}</h2><p class="muted">Say the Dutch sentence. The recording is transcribed and the words are compared. This is not a pronunciation score.</p><div id="speaking-answer"><div class="record-row">${button('record-speaking-practice','Record answer',false)}</div><div class="row"><button id="type-speaking-practice" class="text-link" type="button">Type instead</button><button id="speech-unavailable-practice" class="text-link" type="button">Speech unavailable</button></div><p id="spoken-practice-transcript" class="transcript" lang="nl">Nothing recorded yet.</p></div><div id="feedback" aria-live="polite"></div><div class="actions">${button('check-speaking-practice','Check answer')}</div></article><button id="leave-speaking-practice" class="text-link" type="button">Leave practice — no Course progress to save</button></section>`;
 const convert=(issue=null)=>{
  abandonSpeakingCapture();
  typedFallback=true;
  speechIssue=issue;
  raw='';
  const note=issue==='unclear'?'The recording was not clear enough. Type the Dutch sentence instead. Typing is not speaking evidence.':issue?'Speaking could not be transcribed. Type the Dutch sentence instead. Typing is not speaking evidence.':'Type the Dutch sentence. Typing is not speaking evidence.';
  document.getElementById('speaking-answer').innerHTML=`<p class="small muted">${esc(note)}</p><label for="typed-speaking-answer" class="sr-only">Your Dutch answer</label><input id="typed-speaking-answer" class="input" lang="nl" placeholder="Type in Dutch" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">`;
  const input=document.getElementById('typed-speaking-answer');
  input.oninput=()=>{raw=input.value};
  input.focus();
 };
 const transcribeBlob=async blob=>{
  const line=document.getElementById('spoken-practice-transcript');
  if(line)line.textContent='Transcribing…';
  const heard=await transcribeSpokenAnswer(blob,{origin:location.hostname});
  if(!document.getElementById('check-speaking-practice')||typedFallback)return;
  if(!heard.ok){convert(heard.speechIssue||'unavailable');return;}
  raw=heard.text;
  const transcript=document.getElementById('spoken-practice-transcript');
  if(transcript)transcript.textContent=raw;
  const record=document.getElementById('record-speaking-practice');
  if(record){record.disabled=false;record.textContent='Record again';}
 };
 const startCapture=async()=>{
  abandonSpeakingCapture();
  notify('');
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){convert('unavailable');return;}
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({audio:true});}
  catch{convert('unavailable');return;}
  let recorder;
  try{recorder=new MediaRecorder(stream);}
  catch{stream.getTracks().forEach(track=>track.stop());convert('unavailable');return;}
  const chunks=[];
  const capture={recorder,stream,abandoned:false,stopTimer:0};
  speakingCapture=capture;
  recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data)};
  recorder.onstop=()=>{
   clearTimeout(capture.stopTimer);
   stream.getTracks().forEach(track=>track.stop());
   if(speakingCapture===capture)speakingCapture=null;
   if(capture.abandoned)return;
   const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
   transcribeBlob(blob).catch(()=>convert('unavailable'));
  };
  recorder.start();
  capture.stopTimer=setTimeout(()=>{try{if(recorder.state==='recording')recorder.stop();}catch{}},SPEAKING_MAX_RECORDING_MS);
  const record=document.getElementById('record-speaking-practice');
  if(record)record.textContent='Stop recording';
 };
 on('record-speaking-practice',()=>{
  if(speakingCapture?.recorder?.state==='recording'){
   const record=document.getElementById('record-speaking-practice');
   if(record){record.disabled=true;record.textContent='Transcribing…';}
   try{speakingCapture.recorder.stop();}catch{convert('unavailable');}
   return;
  }
  startCapture();
 });
 on('type-speaking-practice',()=>convert(null));
 on('speech-unavailable-practice',()=>convert('unavailable'));
 on('check-speaking-practice',()=>{
  if(locked)return;
  if(!String(raw).trim()){notify(typedFallback?'Type the Dutch sentence.':'Record an answer first.');return;}
  locked=true;
  abandonSpeakingCapture();
  const next=answerSpeakingPractice(speakingSession,raw,{typedFallback,speechIssue,retried});
  const result=next.answers.at(-1);
  const feedback=speakingPracticeFeedback(result,question,raw);
  el.querySelectorAll('button').forEach(control=>{if(control.id!=='leave-speaking-practice')control.disabled=true});
  document.getElementById('feedback').innerHTML=`<div class="feedback ${result.correct?'ok':result.near?'warn':'bad'}"><strong>${esc(feedback.headline)}</strong><span class="correct" lang="nl">${esc(feedback.dutch)}</span><span class="meaning">${esc(feedback.meaning)}</span>${feedback.heard?`<p>Heard: <span lang="nl">${esc(feedback.heard)}</span></p>`:''}<p>${esc(feedback.note)}</p><div class="badges"><span class="badge">${esc(feedback.badge)}</span><span class="badge">Does not change progress</span></div></div>`;
  const upcoming=currentSpeakingQuestion(next);
  document.querySelector('.actions').innerHTML=`${feedback.retry?button('retry-speaking-practice','Try speaking again',false):''}${button('next-speaking-practice',upcoming?'Continue':'View speaking summary')}`;
  on('retry-speaking-practice',()=>renderSpeakingTurn(question,{retried:true}));
  on('next-speaking-practice',()=>{speakingSession=next;renderSpeakingPractice();});
  document.getElementById('feedback')?.scrollIntoView({block:'nearest'});
  document.getElementById(feedback.retry?'retry-speaking-practice':'next-speaking-practice')?.focus();
 });
 on('leave-speaking-practice',()=>{const conceptId=speakingSession?.conceptId;abandonSpeakingCapture();speakingSession=null;selectedConcept=conceptId||selectedConcept;view='curriculum';render();});
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
 const proofNote=offer?.canStartToday?`<p class="session-offer">The ${esc(offer.id)} ${offer.type} test needs ${offer.needed} free questions today. Pause and start it now, or it waits until tomorrow.</p>`:offer?`<p class="session-offer">${esc(offer.reason)}</p>`:'';
 const header=questionHeader({question:q,dailyCount:state.daily.count,proof:state.proof,extraIndex,extraSize:EXTRA_PRACTICE_SIZE,topicTitle:content.conceptById[q.concept]?.title||q.concept});
 const guidance=guidanceFor(q,state.progress[q.concept],content.conceptById[q.concept],item);
 el.innerHTML=`<section class="session">${header}${proofNote}<article class="card question-card"><span class="direction">${q.direction==='en-nl'?'English → Dutch':'Dutch → English'}</span><div class="q-type">${titles[q.kind]}</div><h2 class="prompt" ${q.direction==='nl-en'&&q.kind!=='listening'||['gap','form','correction'].includes(q.kind)?'lang="nl"':''}>${esc(q.prompt)}</h2>${q.cue?`<p class="muted">Meaning: ${esc(q.cue)}</p>`:''}${q.kind==='listening'?`${button('play','Play Dutch audio',false)}<button id="text-fallback" class="text-link">Audio unavailable? Use text</button>`:''}${q.kind==='speaking'?'<p class="muted">Say the Dutch sentence, or skip and type if you cannot talk now.</p>':''}<div id="answer-area"></div><div id="help-area"></div>${guidance?`<div class="pattern-guidance ${guidance.prominent?'is-early':''}"><button type="button" id="pattern-help" class="text-link">${esc(guidance.label)}</button><p id="pattern-reminder" class="small" hidden>${esc(guidance.text)}</p></div>`:''}<div id="feedback" aria-live="polite"></div><div class="actions">${button('check','Check answer')}</div></article></section>`;
 on('pattern-help',async()=>{await transaction(s=>{if(s.pending?.id!==q.id)throw Error('This question has changed.');useHelp(s)});document.getElementById('pattern-reminder').hidden=false;document.getElementById('pattern-help').disabled=true;});
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
  const helpButton=document.getElementById('help');helpButton.setAttribute('aria-label','Hold for word help. This answer will not count as independent Dutch writing.');
  disposePeek=bindPeek(helpButton,document.getElementById('hint'),{
   reveal:item.vocabulary.map(w=>w.nl+' — '+w.en).join(' · '),
   onUse:()=>transaction(s=>{if(s.pending?.id!==q.id)throw Error('This question has changed.');useHelp(s)}),
   onError:e=>notify(e.message)
  });
 }
 async function check(){if(locked)return;if(!raw.trim()){notify('Enter or choose an answer first.');return;}locked=true;disposePeek();
  try{const rec=await transaction(s=>submit(s,content,q.id,raw,now()));lastFeedback=rec;refreshChrome({extra:q.phase==='extra'});const feedback=correctiveFeedback(q,item,raw,rec);
   if(rec.grammar===false&&['practice','maintenance'].includes(q.phase))feedback.patternTip=patternTipFor(q.concept,item.nl,content.conceptById[q.concept]);
   el.querySelectorAll('input,button').forEach(b=>b.disabled=true);document.getElementById('feedback').innerHTML=answerFeedback(rec,feedback);
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
  el.innerHTML=topicPage(state,content,selectedConcept,{today,proofHTML:proofAction(selectedConcept),dailyCount:state.daily.count,dailyDone:state.daily.count>=20,offer:dailyProofOffer(state,content,now())});
  on('read-course',()=>renderLesson(selectedConcept,false));
  on('back-course',()=>{selectedConcept=null;renderCourse();el.querySelector('h2')?.focus()});
  on('start-course',()=>beginDaily({skipGate:false}));
  on('extra-course',()=>beginExtra(selectedConcept));
  on('start-listening-discrimination',()=>beginDiscrimination(selectedConcept));
  on('start-listening-missing-word',()=>beginMissingWord(selectedConcept));
  on('start-listening-dictation',()=>beginDictation(selectedConcept));
  on('start-listening-exchange',()=>beginExchange(selectedConcept));
  on('start-speaking-practice',()=>beginSpeakingPractice(selectedConcept));
  on('start-controlled-dialogue',()=>beginControlledDialogue(selectedConcept));
  bindProof(selectedConcept);return;
 }
 el.innerHTML=coursePage(state,content,{today,pane:view==='evidence'?'evidence':coursePane,days:courseDays,cohort:courseCohort,concept:courseConcept,offer:dailyProofOffer(state,content,now())});
 if(view!=='evidence'&&state.lastProof)el.querySelector('.course-focus')?.insertAdjacentHTML('afterend',`<details class="course-last-proof" ${state.lastProof.passed?'':'open'}><summary>Latest test result</summary>${proofReport()}</details>`);
 el.querySelectorAll('[data-course-pane]').forEach(b=>b.onclick=()=>{coursePane=b.dataset.coursePane;renderCourse();el.querySelector(`[data-course-pane="${coursePane}"]`)?.focus()});
 el.querySelectorAll('[data-course-cohort]').forEach(b=>b.onclick=()=>{courseCohortTouched=true;courseCohort=b.dataset.courseCohort;renderCourse();el.querySelector(`[data-course-cohort="${courseCohort}"]`)?.focus()});
 el.querySelectorAll('[data-course-concept]').forEach(b=>b.onclick=()=>{selectedConcept=b.dataset.courseConcept;renderCourse();el.querySelector('h2')?.focus()});
 el.querySelectorAll('[data-course-start]').forEach(b=>b.onclick=()=>beginDaily({skipGate:false}));
 const period=document.getElementById('course-period');if(period)period.onchange=()=>{courseDays=period.value==='all'?null:Number(period.value);renderCourse();document.getElementById('course-period')?.focus()};
 const topic=document.getElementById('course-topic-filter');if(topic)topic.onchange=()=>{courseConcept=topic.value||null;renderCourse();document.getElementById('course-topic-filter')?.focus()};
}

function renderMistakes(){
 const bad=state.attempts.filter(x=>x.grammar!==true||x.spelling===false||x.capitalization===false||x.assisted);const counts={};for(const a of bad){const type=a.errorType||(a.capitalization===false?'capitalization':'translation');counts[type]=(counts[type]||0)+1;}
 const weak=Object.entries(state.words).filter(([,w])=>w.weakness>0).sort((a,b)=>b[1].weakness-a[1].weakness).slice(0,10);const vocab=new Map(content.sentences.flatMap(x=>x.vocabulary).map(w=>[w.id,w]));
 el.innerHTML=`<section class="stack mistakes-view"><article class="card evidence-card"><h2>Mistakes & weak areas</h2><p class="muted">Useful evidence, not penalties. Successful recall gradually reduces repetition priority.</p>${bad.length?`<div class="error-grid">${Object.entries(counts).map(([k,n])=>`<div class="error-chip"><span class="eyebrow">${esc(labels[k]||k)}</span><span class="n">${n}</span><span class="small muted">recorded so far</span></div>`).join('')}</div>`:'<div class="empty">No mistakes recorded yet. Start today’s practice to build your learning evidence.</div>'}</article>${weak.length?`<article class="card evidence-card"><h3>Current word priorities</h3><p>${weak.map(([id])=>esc(vocab.get(id)?.nl||id)).join(' · ')}</p></article>`:''}<div class="recent-mistakes">${bad.slice(-25).reverse().map(a=>`<article class="card evidence-card"><div class="eyebrow">${esc(a.concept)} · ${esc(labels[a.errorType]||(a.capitalization===false?'Capitalisation':'Review'))}</div><h3>${esc(a.prompt)}</h3><p class="small">Your answer: ${esc(a.answer)}<br>Model: <strong>${esc(a.correctSentence||content.byId[a.sourceId]?.nl||a.expected)}</strong><br>${esc(a.englishMeaning||content.byId[a.sourceId]?.en||'')}</p>${a.tip?`<p class="tipbox">${esc(a.tip)}</p>`:''}</article>`).join('')}</div></section>`;
}
function renderSettings(){
 el.innerHTML=`<section class="stack"><article class="card evidence-card"><h2>Your app</h2><div class="settings-row row"><label for="listening">Include one listening question in today’s 20</label><input id="listening" type="checkbox" ${state.settings.listening?'checked':''}></div><div class="settings-row row"><label for="speaking">Include one spoken Dutch question when I can talk</label><input id="speaking" type="checkbox" ${state.settings.speaking?'checked':''}></div><p class="muted small">${canUseServerListen()||dutchVoice()?'Listening uses the same Dutch audio as Flashcards.':'Listening audio is not available on this copy yet. Other exercise types remain available.'} Spoken questions can always be skipped and typed. Mastery and retention tests stay written.</p><h3>Where to study</h3><p>Use the GitHub Pages app for genuine Learning and Flashcards. A local or 192.168 address is a development copy with separate browser storage — do not treat it as production.</p><h3>Install & use offline</h3><p>On iPhone or iPad, open the hosted app in Safari, tap Share, then Add to Home Screen. On supported Mac Safari versions, use Add to Dock. Open online once and wait for “Ready offline” below.</p><h3>Progress and backups</h3><p class="muted">Learning saves on this device immediately and syncs across devices when signed in. Flashcards use the live collection. Check the status at the top before changing devices, and export a backup before clearing browser data.</p>${button('export','Export progress',false)} <label class="text-link" for="import">Import V5 backup</label><input id="import" type="file" accept="application/json,.json" class="input spaced"><p class="small muted">Import replaces this app’s current progress. Keep your export first.</p>${state.migration?`<p class="notice">${esc(state.migration.from)} progress imported on this browser origin.</p>`:''}</article><article class="card evidence-card"><details ${dev?'open':''}><summary>Developer & test controls</summary><p class="muted">Use a separate sandbox to jump through states without changing real learning history.</p>${button('toggle-dev',dev?'Return to real learning':'Open developer sandbox',false)}${dev?`<div class="stack spaced"><label>Concept <select id="dev-concept">${content.concepts.map(c=>`<option value="${c.id}">${c.id} · ${esc(c.title)}</option>`).join('')}</select></label><label>State <select id="dev-state"><option value="learning">Learning</option><option value="construct">Construct</option><option value="produce">Produce / Repeat</option><option value="proof-ready">Proof Ready</option><option value="retention-wait">Retention pending</option><option value="retention-ready">Retention Ready</option><option value="mastered">Mastered</option><option value="reinforcement">Reinforcement</option></select></label>${button('jump','Apply sandbox state',false)}${button('preview-mastery-failure','Preview failed mastery result',false)}${button('next-day','Advance sandbox by one day',false)}${button('reset-sandbox','Fresh sandbox',false)}</div>`:''}</details></article></section>`;
 document.getElementById('listening').onchange=async e=>{try{await transaction(s=>s.settings.listening=e.target.checked)}catch(err){notify(err.message)}};
 document.getElementById('speaking').onchange=async e=>{try{await transaction(s=>s.settings.speaking=e.target.checked)}catch(err){notify(err.message)}};
 on('export',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([repo.export(state)],{type:'application/json'}));a.download=`dutch-trainer-v5${dev?'-sandbox':''}-${dayKey(now())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
 document.getElementById('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(!confirm('Replace current V5 progress with this backup?'))return;const text=await f.text();state=repo.import(text);render();}catch(err){notify(err.message)}};
 on('toggle-dev',()=>{dev=!dev;repo=createRepository(localStorage,content,{key:dev?STORAGE_KEY+'-sandbox':STORAGE_KEY});state=repo.load();repo.save(state);render()});
 on('next-day',async()=>{await transaction(s=>{s.settings.debugDate=addDays(dayKey(now()),1);ensureDay(s,new Date(s.settings.debugDate+'T12:00:00'))});render()});
 on('reset-sandbox',()=>{state=freshState(content);repo.save(state);render()});
 on('jump',async()=>{const id=document.getElementById('dev-concept').value,ph=document.getElementById('dev-state').value;await transaction(s=>{const idx=content.concepts.findIndex(c=>c.id===id);for(const [i,c]of content.concepts.entries()){s.progress[c.id]=freshState(content).progress[c.id];if(i<idx)Object.assign(s.progress[c.id],{status:'mastered',masteredAt:dayKey(now()),nextMaintenance:addDays(dayKey(now()),7),taught:true});}const p=s.progress[id];Object.assign(p,{taught:ph!=='learning',recognised:ph==='learning'?0:4,constructed:['learning','construct'].includes(ph)?0:4,practiceAttempts:['learning','construct','produce'].includes(ph)?0:40,independent:['learning','construct','produce'].includes(ph)?0:8,status:['construct','produce'].includes(ph)?'learning':ph});if(ph.startsWith('retention'))p.retentionDue=addDays(dayKey(now()),ph==='retention-ready'?0:3);if(['mastered','reinforcement'].includes(ph)){p.masteredAt=dayKey(now());p.nextMaintenance=dayKey(now())}s.daily={date:dayKey(now()),count:0};s.pending=null;s.proof=null;s.lastProof=null;s.retries=[];});view='curriculum';render()});
 on('preview-mastery-failure',async()=>{
  if(!dev)return;
  const stamp=now(),date=dayKey(stamp),id='A1.7';
  const rows=content.sentences.filter(item=>item.concept===id&&item.pool==='proof').slice(0,20);
  if(rows.length<20)throw Error('The review topic needs 20 proof sentences.');
  await transaction(s=>{
   Object.assign(s,freshState(content,stamp));s.settings.debugDate=date;
   for(const concept of content.concepts){if(concept.id===id)break;Object.assign(s.progress[concept.id],{status:'mastered',masteredAt:date,taught:true,lessonAcknowledged:true,nextMaintenance:'2099-01-01'});}
   Object.assign(s.progress[id],{status:'learning',taught:true,lessonAcknowledged:true,practiceAttempts:40,recognised:10,constructed:10,independent:20});
   const report={id:'sandbox-mastery-result',type:'mastery',concept:id,completedAt:stamp.toISOString(),studyDate:date,directions:{'nl-en':{correct:9,total:10},'en-nl':{correct:9,total:10}},correct:18,total:20,required:19,passed:false};
   s.progress[id].proofHistory=[{...report,id:'sandbox-earlier-result',studyDate:addDays(date,-1)},report];s.lastProof=report;s.daily={date,count:20};
   const prior=content.concepts.slice(0,content.concepts.findIndex(concept=>concept.id===id)+1);
   s.attempts=content.sentences.filter(item=>prior.some(concept=>concept.id===item.concept)&&item.pool==='practice').map(item=>({id:`sandbox-practice-${item.id}`,concept:item.concept,sourceId:item.id,phase:'practice',correctSentence:item.nl}));
   s.attempts.push(...rows.map((item,i)=>{const direction=i%2?'en-nl':'nl-en',wrong=i<2;return {id:`sandbox-proof-${i}`,date,occurredAt:stamp.toISOString(),phase:'mastery',concept:id,sourceId:item.id,direction,kind:i%2?'typed':'choice',grammar:!wrong,spelling:i%2?!wrong:null,assisted:false,errorType:wrong?(i?'verb_form':'translation'):null,correctSentence:item.nl,englishMeaning:item.en,prompt:direction==='nl-en'?item.nl:item.en,answer:wrong?'review':direction==='nl-en'?item.en:item.nl,expected:direction==='nl-en'?item.en:item.nl,verb:item.verb,words:item.vocabulary.map(word=>word.id)};}));
   s.exposures=rows.map(item=>({id:item.id,nl:normalize(item.nl),verb:item.verb,subject:item.subject,family:item.family,words:item.vocabulary.map(word=>word.id),reason:'sandbox-proof'}));
   s.retries=rows.slice(0,2).map((item,i)=>({id:`sandbox-recovery-${i}`,concept:id,verb:item.verb,sourceId:item.id,direction:i?'en-nl':'nl-en',errorType:i?'verb_form':'translation',after:s.attempts.length,date,reason:'mastery-recovery'}));
  });
  view='curriculum';selectedConcept=null;render();
 });
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
