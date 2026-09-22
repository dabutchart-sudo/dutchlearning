import {courseOutline,learningProgress} from '../engine/course-progress.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent=n=>n===null?'—':`${Math.round(n*100)}%`;
const dateLabel=day=>new Date(day+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'});
const button=(id,label,extra='')=>`<button type="button" id="${id}" class="secondary" ${extra}>${label}</button>`;
function paneName(pane){if(pane==='syllabus'||pane==='path')return 'path';if(pane==='progress'||pane==='evidence')return 'evidence';return 'path';}
function dayBanner(daily,offer){
 if(daily?.done)return `<p class="course-day-banner is-done">Today’s 20 are done. Extra practice is optional.</p>`;
 if(offer?.canStartToday)return `<p class="course-day-banner is-test">A ${offer.type} test is ready. Start it from here if you want it today.</p>`;
 return '';
}
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
function progressView(outline,p,days,content){return `${currentCard(outline)}<div class="course-filter-row"><h3>Your practice history</h3><label>Period <select id="course-period"><option value="14" ${days===14?'selected':''}>Last 14 days</option><option value="30" ${days===30?'selected':''}>Last 30 days</option><option value="all" ${days===null?'selected':''}>All history</option></select></label><label>Topic <select id="course-topic-filter"><option value="">All topics</option>${content.concepts.map(c=>`<option value="${esc(c.id)}" ${p.concept===c.id?'selected':''}>${esc(c.id)} · ${esc(c.title)}</option>`).join('')}</select></label></div><div class="course-stat-strip"><div><strong>${p.todayTotal}</strong><span>answers today</span></div><div><strong>${p.studyDays}</strong><span>days studied</span></div><div><strong>${p.total}</strong><span>answers recorded</span></div><div><strong>${p.independent}</strong><span>independent attempts</span></div></div>${trendCard(p)}<div class="course-two-columns">${activityCard(p)}${retainedCard(outline)}</div><p class="course-caption">Learning-course history only. Your existing Flashcard Report remains separate.${p.undated?` ${p.undated} older undated answers cannot be placed on the timeline.`:''}</p>`;}
function unitCopy(level){if(level==='Foundation')return {eyebrow:'Start here',title:'Foundation'};return {eyebrow:'Everyday Dutch',title:level};}
function nodeRing(c){
 if(!c.current||c.retained)return '';
 const portion=c.required?Math.min(100,c.attempts/c.required*100):0;
 return `<svg class="course-node-progress" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" pathLength="100" class="ring-track"/><circle cx="22" cy="22" r="18" pathLength="100" class="ring-value" stroke-dasharray="${portion} 100" transform="rotate(-90 22 22)"/></svg>`;
}
function nodeAction(c,daily){
 if(c.current&&!c.retained){
  if(daily?.done)return `<p class="course-node-note">Today’s 20 are done</p>`;
  if(c.status==='proof-ready'||c.status==='retention-ready')return `<button type="button" class="primary" data-course-start="${esc(c.id)}">${c.status==='retention-ready'?'Start retention test':'Start mastery test'}</button>`;
  return `<button type="button" class="primary" data-course-start="${esc(c.id)}">${daily?.count?'Continue':'Start'}</button>`;
 }
 if(c.retained)return `<button type="button" class="secondary" data-course-extra="${esc(c.id)}">Practise</button>`;
 return '';
}
function pathNode(c,daily){
 const locked=!c.available&&!c.retained;
 return `<li class="course-path-node ${c.current?'is-current':''} ${c.retained?'is-retained':''} ${locked?'is-locked':''}" ${c.current?'data-course-current="true"':''}>
  <div class="course-node-wrap">${nodeRing(c)}<span class="course-node" aria-hidden="true">${c.retained?'✓':c.current?'●':''}</span></div>
  <div class="course-path-card">
   <button type="button" data-course-concept="${esc(c.id)}" ${c.current?'aria-current="step"':''}>
    <span class="course-topic-code">${esc(c.id)}${c.current?' · You’re here':''}</span>
    <strong>${esc(c.title)}</strong>
    <span class="course-topic-status status-${esc(c.status)}">${esc(c.label)}</span>
   </button>
   ${nodeAction(c,daily)}
  </div>
 </li>`;
}
function plannedNode(c){return `<li class="course-path-node is-planned"><div class="course-node-wrap"><span class="course-node" aria-hidden="true"></span></div><div class="course-path-card"><div class="course-planned-label"><span class="course-topic-code">${esc(c.id)}</span><strong>${esc(c.title)}</strong><span class="course-topic-status">Coming later</span></div></div></li>`;}
function pathView(outline,daily,offer){
 const here=outline.current;
 return `<section class="course-path" data-course-path>
  ${dayBanner(daily,offer)}
  <p class="course-path-here">${here?`You’re here — ${esc(here.title)}`:'Every available topic is retained. Maintenance and extra practice keep those skills warm.'}</p>
  ${outline.levels.map(level=>{const topics=outline.topics.filter(c=>c.level===level),copy=unitCopy(level);return `<section class="course-unit"><header class="course-unit-banner ${level==='Foundation'?'is-foundation':'is-a1'}"><span>${esc(copy.eyebrow)}</span><h3>${esc(copy.title)}</h3><small>${topics.filter(c=>c.retained).length} / ${topics.length} retained</small></header><ol class="course-path-list">${topics.map(c=>pathNode(c,daily)).join('')}</ol></section>`;}).join('')}
  ${outline.planned.length?`<section class="course-unit"><header class="course-unit-banner is-planned"><span>Still to come</span><h3>Completing A1</h3><small>${outline.planned.length} planned</small></header><ol class="course-path-list">${outline.planned.map(plannedNode).join('')}</ol></section>`:''}
  <section class="course-future"><span class="eyebrow">Later</span><h3>A2 · Beyond the basics</h3><p>A2 is planned, but its syllabus and exercises are not available yet. Finishing Zin’s course is not an official CEFR qualification.</p></section>
  <aside class="course-method"><h3>How a topic becomes retained</h3><p>Learn → practise → mastery test → wait 3 days → retention check.</p><p>The next topic opens after the retention check. Extra practice on a finished topic is optional and never a second daily session.</p></aside>
 </section>`;
}
export function coursePage(state,content,{today,pane='path',days=30,cohort='independent',concept=null,offer=null}={}){
 const outline=courseOutline(state,content,{today});
 const progress=learningProgress(state,{today,days,cohort,concept});
 const view=paneName(pane);
 const daily={count:state.daily?.count||0,done:(state.daily?.count||0)>=20};
 return `<section class="course-dashboard" data-course-overview ${view==='path'?'data-course-home':'data-course-evidence'}><header class="course-heading"><div><div class="eyebrow">${view==='path'?'Your course':'Your evidence'}</div><h2 tabindex="-1">${view==='path'?'Where you are':'How your answers are changing'}</h2><p>${view==='path'?'See the whole path, then start from here.':'The numbers behind your Learning answers, when you want them.'}</p></div></header>${view==='path'?pathView(outline,daily,offer):progressView(outline,progress,days,content)}</section>`;
}
export function topicPage(state,content,id,{today,proofHTML='',dailyCount=0,dailyDone=false}={}){
 const c=courseOutline(state,content,{today}).topics.find(c=>c.id===id);if(!c)return '';
 // Only display lesson/practice examples, never an unseen proof question.
 const example=content.sentences.find(s=>s.concept===id&&s.pool==='practice'&&s.nl===c.example)||content.sentences.find(s=>s.concept===id&&s.pool==='practice');
 const startLabel=dailyCount?'Continue today’s practice':'Start today’s practice';
 const currentStart=c.current&&c.available&&!c.retained?(dailyDone?'<p class="course-caption">Today’s 20 questions are complete. Come back tomorrow, or practise a finished topic.</p>':`<button type="button" id="start-course" class="primary">${esc(startLabel)}</button>`):'';
 const extraStart=c.retained?`${button('extra-course','Practise this area')}<p class="course-caption">Five extra questions. This is not a second daily session and does not use today’s 20.</p>`:'';
 return `<section class="course-dashboard" data-course-overview>${button('back-course','← Back to your course')}<article class="card course-panel course-topic-detail"><div class="eyebrow">${esc(c.level)} · ${esc(c.label)}</div><h2 tabindex="-1">${esc(c.id)} · ${esc(c.title)}</h2><h3>What you’ll learn</h3><p>${esc(c.rule)}</p>${example?`<div class="course-example"><strong lang="nl">${esc(example.nl)}</strong><span>${esc(example.en)}</span></div>`:''}<div class="course-next"><h3>Your next step</h3><p>${esc(c.nextStep)}</p></div>${c.available?`<label class="course-practice-label" for="topic-practice">${Math.min(c.attempts,c.required)} of ${c.required} required practice answers</label><progress id="topic-practice" max="${c.required}" value="${Math.min(c.attempts,c.required)}"></progress><p class="course-caption">Today’s 20 includes one listening question from this topic. Speaking is one optional spoken sentence you can skip and type. Mastery and delayed retention tests stay written.</p>${currentStart}${proofHTML}${extraStart}${c.available?button('read-course','Read the lesson'):''}`:'<p class="course-caption">You can explore the path now. Scored practice opens after the prerequisite is retained.</p>'}</article></section>`;
}
