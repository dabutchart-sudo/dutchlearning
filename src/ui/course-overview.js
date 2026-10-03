import {courseOutline,learningProgress} from '../engine/course-progress.js';
import {capabilityProfile} from '../engine/capability-progress.js';
import {dailyProofOffer,masteryPracticeNeed,masteryPrerequisiteNeed,phase} from '../engine/learner.js';
import {firstMasteryReadinessNeed} from '../engine/mastery-readiness.js';
import {proofVocabularyNeed} from '../engine/proof-vocabulary.js';
import {availableProofCount} from '../engine/scheduler.js';
import {addDays,dayKey} from '../engine/util.js';
import {dailyRecap} from './teaching-support.js';
import {sentenceDiscriminationOffer} from '../engine/listening-discrimination.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=n=>n===null?'—':`${Math.round(n*100)}%`;
const dateLabel=day=>new Date(day+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const nextStudyDay=day=>`From ${dateLabel(addDays(day,1))}, on a study day`;
const remainingToday=(state,today)=>state.daily?.date===today?Math.max(0,20-(state.daily.count||0)):20;

export function testTiming(state,content,id,today,offer=dailyProofOffer(state,content,new Date(today+'T12:00:00'))){
 const progress=state.progress[id],latest=progress.proofHistory?.at(-1),status=phase(progress,today);
 const activeOffer=offer?.id===id?offer:null;
 const masteryPassed=!!(progress.retentionDue||progress.masteredAt||progress.proofHistory?.some(report=>report.type==='mastery'&&report.passed));
 const needsMasteryRetake=latest?.passed===false&&['mastery','retention'].includes(latest.type);
 const masteryName=progress.proofHistory?.some(report=>report.type==='mastery')?'Mastery retake':'Mastery test';
 let mastery;
 if(state.proof?.concept===id&&state.proof.type==='mastery')mastery={name:masteryName,when:'In progress',detail:'Finish the test already under way.'};
 else if(masteryPassed&&!needsMasteryRetake)mastery={name:'Mastery test',when:'Passed',detail:'The next check is retention.'};
 else{
  const practice=masteryPracticeNeed(state,content,id);
  const writing=firstMasteryReadinessNeed(state,id,new Date(today+'T12:00:00'));
  const vocabulary=proofVocabularyNeed(state,content,id,'mastery');
  const fresh=availableProofCount(state,content,id);
  const failedToday=latest?.type==='mastery'&&latest.passed===false&&(latest.studyDate||latest.completedAt?.slice(0,10))===today;
  let detail;
  if(status==='proof-ready'&&masteryPrerequisiteNeed(state,content,id))detail=masteryPrerequisiteNeed(state,content,id);
  else if(progress.remedial&&latest?.type==='retention'&&latest.passed===false)detail=`Complete ${progress.remedial} successful practice ${progress.remedial===1?'answer':'answers'} after the missed retention check.`;
  else if(practice)detail=practice;
  else if(writing)detail=writing;
  else if(vocabulary?.missing)detail=vocabulary.potential<vocabulary.required?'More fresh test sentences are needed; practice cannot restore already-used questions.':`${vocabulary.available} of ${vocabulary.required} fresh test sentences currently use words you have completed in practice. Continue this topic’s practice to introduce the missing words.`;
  else if(fresh<20)detail='More fresh test sentences are needed; practice cannot restore already-used questions.';
  else detail=null;
  if(detail)mastery={name:masteryName,when:'No date yet',detail:`${detail} Once ready, take the full test on a study day with all 20 questions unused.`};
  else if(failedToday||remainingToday(state,today)<20)mastery={name:masteryName,when:nextStudyDay(today),detail:'A full mastery test needs all 20 questions unused on that day.'};
  else if(status==='proof-ready'&&activeOffer?.canStartToday)mastery={name:masteryName,when:'Available today',detail:'Start before answering an ordinary practice question; an unanswered question can be set aside.'};
  else mastery={name:masteryName,when:'No date yet',detail:'Continue this topic’s practice until the mastery test is ready.'};
 }
 let retention;
 if(state.proof?.concept===id&&state.proof.type==='retention')retention={name:'Retention test',when:'In progress',detail:'Finish the test already under way.'};
 else if(progress.masteredAt)retention={name:'Retention test',when:'Passed',detail:'This topic is retained.'};
 else if(progress.retentionDue){
  const vocabulary=proofVocabularyNeed(state,content,id,'retention');
  const fresh=availableProofCount(state,content,id);
  const missing=vocabulary?.missing||fresh<10;
  const exhausted=vocabulary?.potential<vocabulary?.required||!vocabulary&&fresh<10;
  const freshDetail=vocabulary?.missing?`${vocabulary.available} of 10 fresh test sentences currently use practised words.`:fresh<10?'Fewer than ten compatible fresh test sentences remain.':'Ten fresh test sentences are available.';
  if(today<progress.retentionDue&&exhausted)retention={name:'Retention test',when:'No date yet',detail:`The three-day wait ends ${dateLabel(progress.retentionDue)}, but more fresh test sentences are needed. Practice cannot restore used questions.`};
  else if(today<progress.retentionDue)retention={name:'Retention test',when:`Earliest ${dateLabel(progress.retentionDue)}`,detail:`It needs ten unused daily questions. ${freshDetail}`};
  else if(missing)retention={name:'Retention test',when:'No date yet',detail:vocabulary?.potential<vocabulary?.required||fresh<10?'More fresh test sentences are needed; practice cannot restore already-used questions.':`${vocabulary.available} of 10 fresh test sentences currently use words you have completed in practice.`};
  else if(remainingToday(state,today)<10)retention={name:'Retention test',when:nextStudyDay(today),detail:'It needs ten unused daily questions and ten fresh sentences.'};
  else if(status==='retention-ready'&&activeOffer?.canStartToday)retention={name:'Retention test',when:'Available today',detail:'It uses ten of today’s 20 questions.'};
  else retention={name:'Retention test',when:'No date yet',detail:'Complete the current test before another one can start.'};
 }else retention={name:'Retention test',when:needsMasteryRetake?'After the next mastery pass':'After mastery passes',detail:'It opens three calendar days after a passed mastery test, provided ten fresh sentences and ten daily questions are available.'};
 return {mastery,retention};
}

function testTimingCard(state,content,id,today,offer){
 const timing=testTiming(state,content,id,today,offer);
 return `<section class="course-test-timing" aria-label="Mastery and retention test timing"><h3>When can I take a test?</h3>${[timing.mastery,timing.retention].map(row=>`<div class="course-test-timing-row"><span>${esc(row.name)}</span><strong>${esc(row.when)}</strong><p>${esc(row.detail)}</p></div>`).join('')}</section>`;
}
const button=(id,label,extra='')=>`<button type="button" id="${id}" class="secondary" ${extra}>${label}</button>`;
function paneName(pane){if(pane==='syllabus'||pane==='path')return 'path';if(pane==='progress'||pane==='evidence')return 'evidence';return 'path';}
function ring(retained,total){const portion=total?retained/total*100:0;return `<div class="course-ring"><svg viewBox="0 0 120 120" role="img" aria-label="${retained} of ${total} available topics retained"><circle cx="60" cy="60" r="50" pathLength="100" class="ring-track"/><circle cx="60" cy="60" r="50" pathLength="100" class="ring-value" stroke-dasharray="${portion} 100" transform="rotate(-90 60 60)"/></svg><div aria-hidden="true"><strong>${retained}<small> / ${total}</small></strong><span>topics retained</span></div></div>`;}
function currentCard(outline){const c=outline.current;return `<article class="course-location"><div><div class="eyebrow">${c?'YOU ARE HERE':'AVAILABLE COURSE RETAINED'}</div><h3>${c?`${esc(c.id)} · ${esc(c.title)}`:'A foundation you can build on'}</h3><p>${c?esc(c.nextStep):'You have retained every available topic. Maintenance keeps those skills in use; more A1 material is planned.'}</p>${c?`<button type="button" data-course-concept="${esc(c.id)}">See this topic <span aria-hidden="true">→</span></button>`:''}</div>${ring(outline.retained,outline.total)}<div class="course-mobile-total">${outline.retained} of ${outline.total} available topics retained</div></article>`;}
function chart(progress){
 const rows=progress.daily,hasPoint=rows.some(d=>d.grammar.total||d.spelling.total);
 if(!hasPoint)return `<div class="course-chart-empty"><span aria-hidden="true">↗</span><h4>${progress.todayTotal||progress.selected.total?'Your first evidence is here':'Your progress starts with practice'}</h4><p>${progress.todayTotal||progress.selected.total?`${progress.todayTotal||progress.selected.total} answers recorded. A comparison line appears after assessed answers on at least two study days.`:'Complete today’s Learning session to begin your chart. Days without practice never count as failures.'}</p></div>`;
 const width=640,height=220,left=56,right=20,top=20,bottom=36;
 const first=Date.parse(progress.start+'T12:00:00Z'),last=Date.parse(progress.today+'T12:00:00Z');
 const x=date=>left+(Date.parse(date+'T12:00:00Z')-first)/Math.max(86400000,last-first)*(width-left-right);
 const y=rate=>top+(1-rate)*(height-top-bottom);
 const traces=['grammar','spelling'].map(field=>{
  let previous=null,lines='',dots='';
  for(const row of rows){const metric=row[field];if(metric.rate===null){previous=null;continue;}
   if(previous&&(Date.parse(row.date)-Date.parse(previous.date))===86400000)lines+=`<line x1="${x(previous.date)}" y1="${y(previous[field].rate)}" x2="${x(row.date)}" y2="${y(metric.rate)}"/>`;
   dots+=`<circle cx="${x(row.date)}" cy="${y(metric.rate)}" r="4"><title>${esc(dateLabel(row.date))}: ${field} ${metric.correct}/${metric.total} (${percent(metric.rate)})</title></circle>`;previous=row;
  }
  return `<g class="chart-${field}">${lines}${dots}</g>`;
 }).join('');
 return `<svg class="course-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="course-chart-title course-chart-description"><title id="course-chart-title">Grammar and spelling accuracy by study day</title><desc id="course-chart-description">${progress.cohort==='independent'?'Independent sentence writing':progress.cohort==='supported'?'Supported and recognition exercises':'All scored Learning answers'}. Missing days are gaps, not zero scores. Exact counts are in the daily numbers below.</desc>${[0,.5,1].map(rate=>`<line class="chart-grid" x1="${left}" y1="${y(rate)}" x2="${width-right}" y2="${y(rate)}"/><text class="chart-axis" x="${left-8}" y="${y(rate)+4}" text-anchor="end">${rate*100}%</text>`).join('')}${traces}<text class="chart-axis" x="${left}" y="${height-10}">${esc(dateLabel(progress.start))}</text><text class="chart-axis" x="${width-right}" y="${height-10}" text-anchor="end">${esc(dateLabel(progress.today))}</text></svg>`;
}
function summaryMetric(label,metric){return `<div><span>${label}</span><strong>${percent(metric.rate)}</strong><small>${metric.total?`${metric.correct} of ${metric.total} assessed answers`:'No assessed answers yet'}</small></div>`;}
function trendCard(p){const group=p.cohort==='independent'?'independent':p.cohort==='supported'?'supported':'learning';const delta=p.comparison?Math.round(p.comparison.delta*100):null;
 const comparison=delta===null?'A comparison appears after 40 answers in this group, with at least 10 assessed grammar answers in each set of 20.':delta===0?'Grammar accuracy is unchanged across your last two sets of 20 answers.':`Grammar accuracy is ${Math.abs(delta)} percentage points ${delta>0?'higher':'lower'} in your latest 20 answers than in the preceding 20.`;
 return `<article class="card course-panel"><div class="course-panel-heading"><div><div class="eyebrow">YOUR ${group.toUpperCase()} PRACTICE</div><h3>How your answers are changing</h3></div><div class="course-cohorts" role="group" aria-label="Evidence group">${[['all','All practice'],['independent','On my own'],['supported','With support']].map(([id,label])=>`<button type="button" data-course-cohort="${id}" aria-pressed="${p.cohort===id}">${label}</button>`).join('')}</div></div><p class="course-caption">${p.cohort==='independent'?'Full English → Dutch sentences, without word help. Every attempt counts here, including unsuccessful attempts.':p.cohort==='supported'?'Word banks, missing forms, recognition, listening and answers using help. These are kept separate from independent sentence writing.':'Every scored Learning answer, including today’s listening, speaking, recognition and typed sentences.'}</p><div class="course-accuracy">${summaryMetric('Grammar',p.selected.grammar)}${summaryMetric('Spelling',p.selected.spelling)}</div><div class="course-chart-legend"><span><i class="legend-grammar"></i>Grammar</span><span><i class="legend-spelling"></i>Spelling</span></div>${chart(p)}<p class="course-caption">Each point is one study day. Gaps mean no assessed answers. ${p.selected.grammar.unassessed} grammar answers unproven or unrecorded; excluded from grammar accuracy. Spelling includes only recorded spelling checks.</p><div class="course-comparison"><strong>${esc(comparison)}</strong><p>Exercise difficulty and topic mix can change. These are practice results, not a fluency score.</p></div>${p.daily.length?`<details class="course-data"><summary>View daily numbers</summary><div class="course-table-wrap"><table><caption class="sr-only">${group} practice by study day</caption><thead><tr><th scope="col">Day</th><th scope="col">Answers</th><th scope="col">Grammar</th><th scope="col">Spelling</th></tr></thead><tbody>${p.daily.slice().reverse().map(d=>`<tr><th scope="row">${esc(dateLabel(d.date))}</th><td>${d.total}</td><td>${d.grammar.total?`${d.grammar.correct}/${d.grammar.total}`:'—'}</td><td>${d.spelling.total?`${d.spelling.correct}/${d.spelling.total}`:'—'}</td></tr>`).join('')}</tbody></table></div></details>`:''}</article>`;
}
function activityCard(p){const total=p.total||1;return `<article class="card course-panel"><div class="eyebrow">WAYS YOU PRACTISE</div><h3>Building independence</h3><div class="course-practice-mix" role="img" aria-label="${p.independent} independent and ${p.supported} supported answers"><span class="mix-independent" style="width:${p.independent/total*100}%"></span><span class="mix-supported" style="width:${p.supported/total*100}%"></span></div><dl class="course-mix-labels"><div><dt>On my own</dt><dd>${p.independent}</dd></div><div><dt>With support</dt><dd>${p.supported}</dd></div></dl><p class="course-caption">Support includes recognition and guided exercises, not just word help. ${p.assisted} answers used word help. Both kinds of practice have a place.${p.unclassified?` ${p.unclassified} older answers lack enough information to classify and are excluded from both groups.`:''}</p></article>`;}
function retainedCard(outline){const retained=outline.topics.filter(c=>c.retained);return `<article class="card course-panel"><div class="eyebrow">WHAT HAS STUCK</div><h3>Skills you’ve retained</h3>${retained.length?`<ul class="course-retained-list">${retained.map(c=>`<li><span aria-hidden="true">✓</span><button type="button" data-course-concept="${esc(c.id)}">${esc(c.title)}</button><small>${esc(c.retainedAt)}</small></li>`).join('')}</ul>`:'<p class="course-caption">Your first retained skill appears here after a mastery test and a successful delayed retention check. Practice answers alone do not mark a skill retained.</p>'}</article>`;}
function capabilityCard(state,today){
 const profile=capabilityProfile(state,{today});
 return `<section class="card course-panel" aria-labelledby="capability-title"><div class="eyebrow">WHAT YOUR ANSWERS SHOW</div><h3 id="capability-title">Capability profile</h3><p class="course-caption">Each area uses its own recorded evidence. Counts show recorded answers or distinct words, not a combined ability score. A correct practice answer is not a passed proof.</p><div class="course-capability-grid">${profile.map(c=>`<article class="course-capability"><h4>${esc(c.title)}</h4><strong>${c.id==='recall'?(c.total?`${c.correct} of ${c.total} distinct words recalled`:'No word recall recorded yet'):c.total?`${c.correct} of ${c.total} assessed answers`:'No assessed answers yet'}</strong><p>${esc(c.detail)}</p><small>${esc(c.rule)}</small></article>`).join('')}</div></section>`;
}
function journeyCard(outline){const c=outline.current;return `<article class="card course-panel"><div class="eyebrow">COURSE JOURNEY</div><h3>Where you are</h3>${c?`<p><strong>${esc(c.id)} · ${esc(c.title)} — ${esc(c.journey.label)}</strong></p><p class="course-caption">${esc(c.journey.reason)} ${esc(c.nextStep)}</p>`:'<p class="course-caption">All available topics have passed delayed retention. Future reviews keep them in use.</p>'}<p class="course-caption">Topic states describe the learning path. Capability evidence and Flashcard retention are shown separately.</p></article>`;}
function progressView(outline,p,days,content,state,today){return `${currentCard(outline)}${journeyCard(outline)}${capabilityCard(state,today)}<div class="course-filter-row"><h3>Your practice history</h3><label>Period <select id="course-period"><option value="14" ${days===14?'selected':''}>Last 14 days</option><option value="30" ${days===30?'selected':''}>Last 30 days</option><option value="all" ${days===null?'selected':''}>All history</option></select></label><label>Topic <select id="course-topic-filter"><option value="">All topics</option>${content.concepts.map(c=>`<option value="${esc(c.id)}" ${p.concept===c.id?'selected':''}>${esc(c.id)} · ${esc(c.title)}</option>`).join('')}</select></label></div><div class="course-stat-strip"><div><strong>${p.todayTotal}</strong><span>answers today</span></div><div><strong>${p.studyDays}</strong><span>days studied</span></div><div><strong>${p.total}</strong><span>answers recorded</span></div><div><strong>${p.independent}</strong><span>independent attempts</span></div></div>${trendCard(p)}<div class="course-two-columns">${activityCard(p)}${retainedCard(outline)}</div><p class="course-caption">Learning-course history only. Your existing Flashcard Report remains separate.${p.undated?` ${p.undated} older undated answers cannot be placed on the timeline.`:''}</p>`;}
function unitCopy(level){if(level==='Foundation')return {eyebrow:'Start here',title:'Foundation'};return {eyebrow:'Everyday Dutch',title:level};}
function courseFocus(outline,daily,offer){
 const c=outline.current;
 if(!c)return `<article class="course-focus"><span class="eyebrow">Course complete so far</span><h3>All available topics retained</h3><p>More A1 topics are planned. Retained topics remain available below.</p></article>`;
 const ready=!daily.done&&offer?.canStartToday&&(!offer.id||offer.id===c.id);
 const action=ready?'Choose test or practice':daily.done?'':c.status==='lesson'?'Start learning':'Continue learning';
 const note=daily.done?'Learning complete for today.':ready?offer.type==='mastery'?'A full mastery test is available today, or you can keep practising. Availability does not predict a pass.':'A delayed retention test is available today, or you can keep practising.':c.status==='lesson'?'Begins with the lesson.':'';
 return `<article class="course-focus" data-course-focus><span class="eyebrow">Current topic · ${esc(c.id)}</span><h3>${esc(c.title)}</h3>${note?`<p>${esc(note)}</p>`:''}<div class="course-focus-actions">${action?`<button type="button" class="primary" data-course-start="${esc(c.id)}">${esc(action)}</button>`:''}<button type="button" class="course-focus-details" data-course-concept="${esc(c.id)}">Topic details</button></div></article>`;
}
function pathNode(c){
 const locked=!c.available&&!c.retained;
 const reason=locked?`<small class="course-locked-reason">${c.journey.label==='Paused'?'Pass earlier retention to continue':'Pass '+esc((c.prerequisites||[]).join(' and '))+' mastery first'}</small>`:'';
 return `<li class="course-path-node ${c.current?'is-current':''} ${c.retained?'is-retained':''} ${locked?'is-locked':''}" ${c.current?'data-course-current="true"':''}>
  <div class="course-node-wrap"><span class="course-node" aria-hidden="true">${c.retained?'✓':c.current?'●':''}</span></div>
  <div class="course-path-card">
   <button type="button" data-course-concept="${esc(c.id)}" ${c.current?'aria-current="step"':''}>
    <span class="course-topic-code">${esc(c.id)}${c.current?' · You’re here':''}</span>
    <span class="course-path-main"><strong>${esc(c.title)}</strong><span class="course-topic-status status-${esc(c.status)}">${esc(c.journey.label)}</span></span>
    ${reason}
   </button>
  </div>
 </li>`;
}
function plannedNode(c){return `<li class="course-path-node is-planned"><div class="course-node-wrap"><span class="course-node" aria-hidden="true"></span></div><div class="course-path-card"><div class="course-planned-label"><span class="course-topic-code">${esc(c.id)}</span><strong>${esc(c.title)}</strong><span class="course-topic-status">Coming later</span></div></div></li>`;}
function recapCard(recap){
 if(!recap)return '';
 return `<article class="card course-daily-recap"><div class="eyebrow">TODAY'S LEARNING</div><h3>Your daily recap</h3><p>You finished all ${recap.answered} questions. ${recap.independent} answers showed independent Dutch writing${recap.supported?`; ${recap.supported} used help`:''}.</p>${recap.revisit.length?`<h4>Useful patterns to revisit</h4><ul>${recap.revisit.map(item=>`<li><strong>${esc(item.concept)} · ${esc(item.title)}</strong><span lang="nl">${esc(item.sentence)}</span><small>${esc(item.meaning)}</small></li>`).join('')}</ul>`:'<p>Your last 20 answers had no grammar or spelling misses to revisit.</p>'}<p class="course-caption">This recap reflects recorded answers. It does not change your course evidence or add questions.</p></article>`;
}
function pathView(outline,daily,offer,recap){
 const waiting=outline.topics.find(c=>c.status==='retention-wait'&&!c.current);
 return `<section class="course-path" data-course-path>
  ${courseFocus(outline,daily,offer)}
  ${waiting?`<article class="card course-panel course-waiting-path"><strong>${esc(waiting.id)} retention is still due</strong><p>You can study ${esc(outline.current?.id||'the next topic')} while you wait. The delayed test can open from ${esc(waiting.retentionDue)} when ten fresh sentences and ten daily questions are available. This topic is not retained yet.</p><button type="button" data-course-concept="${esc(waiting.id)}">See retention timing</button></article>`:''}
  ${recapCard(recap)}
  ${outline.levels.map(level=>{const topics=outline.topics.filter(c=>c.level===level),copy=unitCopy(level);return `<section class="course-unit"><header class="course-unit-banner ${level==='Foundation'?'is-foundation':'is-a1'}"><span>${esc(copy.eyebrow)}</span><h3>${esc(copy.title)}</h3><small>${topics.filter(c=>c.retained).length} / ${topics.length} retained</small></header><ol class="course-path-list">${topics.map(pathNode).join('')}</ol></section>`;}).join('')}
  ${outline.planned.length?`<section class="course-unit"><header class="course-unit-banner is-planned"><span>Still to come</span><h3>Completing A1</h3><small>${outline.planned.length} planned</small></header><ol class="course-path-list">${outline.planned.map(plannedNode).join('')}</ol></section>`:''}
  <section class="course-future"><span class="eyebrow">Later</span><h3>A2 · Beyond the basics</h3><p>A2 is planned, but its syllabus and exercises are not available yet. Finishing Zin’s course is not an official CEFR qualification.</p></section>
 </section>`;
}
export function coursePage(state,content,{today,pane='path',days=30,cohort='independent',concept=null,offer=null}={}){
 const outline=courseOutline(state,content,{today});
 const progress=learningProgress(state,{today,days,cohort,concept});
 const view=paneName(pane);
 const dailyCount=state.daily?.date===today?state.daily.count||0:0;
 const daily={done:dailyCount>=20};
 return `<section class="course-dashboard" data-course-overview ${view==='path'?'data-course-home':'data-course-evidence'}><header class="course-heading">${view==='path'?'<div class="eyebrow">Your course</div><h2 class="sr-only" tabindex="-1">Course</h2>':'<div><div class="eyebrow">Your evidence</div><h2 tabindex="-1">How your answers are changing</h2><p>The numbers behind your Learning answers, when you want them.</p></div>'}</header>${view==='path'?pathView(outline,daily,offer,dailyRecap(state,content,today)):progressView(outline,progress,days,content,state,today)}</section>`;
}
export function topicPage(state,content,id,{today=dayKey(),proofHTML='',dailyCount=0,dailyDone=false,offer}={}){
 const c=courseOutline(state,content,{today}).topics.find(c=>c.id===id);if(!c)return '';
 // Only display lesson/practice examples, never an unseen proof question.
 const example=content.sentences.find(s=>s.concept===id&&s.pool==='practice'&&s.nl===c.example)||content.sentences.find(s=>s.concept===id&&s.pool==='practice');
 const startLabel=state.pending&&['practice','maintenance'].includes(state.pending.phase)?'Continue current question':dailyCount?'Continue today’s practice':'Start today’s practice';
 const currentStart=c.current&&c.available&&!c.retained?(dailyDone?'<p class="course-caption">Today’s 20 questions are complete. Come back tomorrow, or practise a finished topic.</p>':`<button type="button" id="start-course" class="primary">${esc(startLabel)}</button>`):'';
 const extraStart=c.retained?`${button('extra-course','Practise this area')}<p class="course-caption">Five extra questions. This is not a second daily session and does not use today’s 20.</p>`:'';
 const testVisible=['proof-ready','retention-ready'].includes(c.status);
 const evidence=c.available?`<details class="course-topic-evidence"><summary>Practice and proof details</summary><label class="course-practice-label" for="topic-practice">${Math.min(c.attempts,c.required)} of ${c.required} required practice answers</label><progress id="topic-practice" max="${c.required}" value="${Math.min(c.attempts,c.required)}"></progress>${testVisible?'':proofHTML}<p class="course-caption">Today’s 20 includes one listening question from this topic. Speaking can be skipped and typed. Mastery and delayed retention tests stay written.</p><p class="course-caption">A topic is retained only after a mastery test and a successful delayed retention check.</p></details>`:'';
 const listening=discriminationPracticeCard(state,content,c);
 return `<section class="course-dashboard" data-course-overview>${button('back-course','← Back to your course')}<article class="card course-panel course-topic-detail"><div class="eyebrow">${esc(c.level)} · ${esc(c.label)}</div><h2 tabindex="-1">${esc(c.id)} · ${esc(c.title)}</h2><div class="course-next"><h3>Your next step</h3><p><strong>${esc(c.journey.label)}.</strong> ${esc(c.journey.reason)}</p><p>${esc(c.nextStep)}</p></div>${c.available&&!c.retained&&(c.current||c.status==='retention-wait'||c.status==='retention-ready')?testTimingCard(state,content,id,today,offer):''}${currentStart}${testVisible?proofHTML:''}${extraStart}<div class="course-topic-lesson"><h3>What you’ll learn</h3><p>${esc(c.rule)}</p>${example?`<div class="course-example"><strong lang="nl">${esc(example.nl)}</strong><span>${esc(example.en)}</span></div>`:''}</div>${listening}${evidence}${c.available?button('read-course','Read the lesson'):''}</article></section>`;
}

function discriminationPracticeCard(state,content,topic){
 if(!topic.available)return '';
 const offer=sentenceDiscriminationOffer(state,content,topic.id);
 if(!offer)return '';
 const label=offer.count===1?'Practise 1 sentence':`Practise ${offer.count} sentences`;
 return `<section class="course-listen-discrimination"><div class="eyebrow">OPTIONAL PRACTICE · LISTENING</div><h3>Which sentence did you hear?</h3><p>Play a hidden Dutch sentence, then choose the matching Dutch line. This short activity does not use today’s 20 or change Course, mastery, or retention progress.</p>${button('start-listening-discrimination',label)}</section>`;
}
