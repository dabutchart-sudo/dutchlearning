import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerPacks} from '../src/content/registry.js';
import {freshState,submit} from '../src/engine/learner.js';
import {makeExercise,correctiveFeedback} from '../src/engine/exercises.js';
import {assess} from '../src/engine/scoring.js';
import {courseOutline,learningProgress} from '../src/engine/course-progress.js';
import {coursePage,topicPage} from '../src/ui/course-overview.js';
const content=registerPacks([JSON.parse(readFileSync(new URL('../src/content/foundation-a1.json',import.meta.url)))]);
const now=new Date('2026-09-18T12:00:00'),today='2026-09-18';
const fresh=()=>freshState(content,now);
const studied=(s,id)=>Object.assign(s.progress[id],{taught:true,lessonAcknowledged:true,practiceAttempts:40});
const attempt=(overrides={})=>({date:today,kind:'typed',direction:'en-nl',assisted:false,grammar:true,spelling:true,concept:'F1',...overrides});

test('outline uses the full registered curriculum, not just the base content pack',()=>{
 const s=fresh(),before=JSON.stringify(s),outline=courseOutline(s,content,{today});
 assert.equal(outline.total,28);assert.equal(outline.current.id,'F1');assert.equal(outline.current.status,'lesson');assert.equal(outline.retained,0);
 assert.equal(outline.topics.find(c=>c.id==='A1.20').status,'upcoming');assert.equal(outline.planned.length,4);
 assert.equal(outline.planned[0].id,'A1.23');assert.equal(outline.planned.at(-1).id,'A1.26');assert.equal(JSON.stringify(s),before);
});
test('syllabus mirrors retention, readiness, daily budget, and remedial rules without unlocking topics',()=>{
 const s=fresh();studied(s,'F1');s.progress.F1.status='proof-ready';s.daily.count=3;
 let o=courseOutline(s,content,{today});assert.match(o.current.nextStep,/next study day/);assert.equal(o.topics[1].available,false);
 s.progress.F1.status='retention-wait';s.progress.F1.retentionDue='2026-09-20';
 o=courseOutline(s,content,{today});assert.equal(o.current.status,'retention-wait');assert.match(o.current.nextStep,/2026-09-20/);
 o=courseOutline(s,content,{today:'2026-09-20'});assert.equal(o.current.status,'retention-ready');assert.match(o.current.nextStep,/10-question/);
 s.progress.F1.masteredAt=today;s.progress.F1.status='mastered';s.progress.F1.retentionDue=null;
 o=courseOutline(s,content,{today});assert.equal(o.current.id,'F2');assert.equal(o.retained,1);
 studied(s,'F2');s.progress.F2.remedial=3;
 o=courseOutline(s,content,{today});assert.match(o.current.nextStep,/3 successful practice answers/);assert.equal(o.topics[2].available,false);
});
test('outline uses configured practice requirements and handles completed course',()=>{
 const s=fresh(),c={...content,concepts:content.concepts.map(c=>({...c,minPractice:50}))};studied(s,'F1');
 assert.equal(courseOutline(s,c,{today}).current.remaining,10);
 for(const c of content.concepts)Object.assign(s.progress[c.id],{masteredAt:today,status:'mastered',lessonAcknowledged:true});
 const o=courseOutline(s,content,{today});assert.equal(o.current,null);assert.equal(o.retained,28);assert.equal(o.planned.length,4);
});
test('independent denominator includes failed attempts and excludes word help and scaffolding',()=>{
 const s=fresh();s.attempts=[attempt({grammar:false,independent:false}),attempt({independent:true}),attempt({assisted:true}),attempt({kind:'gap'}),attempt({kind:'wordbank',spelling:null}),attempt({kind:'choice',direction:'nl-en',spelling:null})];
 const p=learningProgress(s,{today});assert.equal(p.independent,2);assert.equal(p.supported,4);assert.equal(p.selected.grammar.rate,.5);assert.equal(p.selected.grammar.total,2);assert.equal(p.assisted,1);
 const supported=learningProgress(s,{today,cohort:'supported'});assert.equal(supported.selected.total,4);assert.equal(supported.selected.spelling.total,2);
});
test('missing spelling and unproven grammar are not counted as wrong',()=>{
 const s=fresh();s.attempts=[attempt(),attempt({grammar:null,spelling:false}),attempt({grammar:undefined,spelling:undefined}),attempt({spelling:null})];
 const p=learningProgress(s,{today});assert.equal(p.selected.grammar.rate,1);assert.equal(p.selected.grammar.total,2);assert.equal(p.selected.grammar.unassessed,2);assert.equal(p.selected.spelling.rate,.5);assert.equal(p.selected.spelling.total,2);
});
test('periods, topic filters, missing dates, duplicates and future attempts are handled honestly',()=>{
 const s=fresh();s.attempts=[attempt({date:'2026-08-01'}),attempt({date:'2026-09-05',id:'once'}),attempt({date:'2026-09-05',id:'once'}),attempt({date:'2026-09-08',concept:'F2'}),attempt({date:'2026-09-19'}),attempt({date:'bad'}),attempt({date:'2026-02-30'})];
 let p=learningProgress(s,{today,days:14,concept:'F1'});assert.equal(p.total,1);assert.equal(p.studyDays,1);assert.equal(p.daily.length,1);assert.equal(p.daily[0].date,'2026-09-05');assert.equal(p.undated,2);
 p=learningProgress(s,{today,days:null});assert.equal(p.total,3);assert.equal(p.start,'2026-08-01');assert.equal(p.daily.length,3);
 assert.throws(()=>learningProgress(s,{today:'bad'}));assert.throws(()=>learningProgress(s,{today,days:0}));
});
test('comparison waits for sufficient evidence and reports percentage points without invented improvement',()=>{
 const s=fresh();s.attempts=Array.from({length:39},(_,i)=>attempt({grammar:i>=20||i%2===0}));
 assert.equal(learningProgress(s,{today}).comparison,null);
 s.attempts.push(attempt());assert.equal(learningProgress(s,{today}).comparison.delta,.5);
 s.attempts.slice(0,15).forEach(a=>a.grammar=null);assert.equal(learningProgress(s,{today}).comparison,null);
});
test('empty dashboard shows no fabricated trend or fluency score; known history is read-only',()=>{
 const s=fresh(),before=JSON.stringify(s);const html=coursePage(s,content,{today,pane:'progress'});
 assert.match(html,/Your progress starts with practice/);assert.doesNotMatch(html,/<svg class="course-trend-chart"/);assert.match(html,/not a fluency score/);assert.equal(JSON.stringify(s),before);
});
test('chart has an accessible numerical alternative and separates evidence groups',()=>{
 const s=fresh();s.attempts=[attempt({date:'2026-09-17'}),attempt({grammar:false,spelling:false}),attempt({kind:'gap',assisted:true})];
 const html=coursePage(s,content,{today,pane:'progress'});assert.match(html,/course-chart-description/);assert.match(html,/View daily numbers/);assert.match(html,/Every attempt counts here/);assert.match(html,/data-course-cohort="supported"/);
 const supported=coursePage(s,content,{today,pane:'progress',cohort:'supported'});assert.match(supported,/kept separate from independent sentence writing/);
});
test('locked topics are browsable but cannot launch lessons; only later topics remain planned',()=>{
 const s=fresh();const html=coursePage(s,content,{today,pane:'path'});assert.match(html,/A1.26/);assert.match(html,/A2 · Beyond the basics/);assert.match(html,/Coming later/);assert.match(html,/data-course-concept="A1.22"/);assert.doesNotMatch(html,/data-course-concept="A1.23"/);
 const locked=topicPage(s,content,'A1.20',{today});assert.match(locked,/What you’ll learn/);assert.match(locked,/Retain A1.19/);assert.doesNotMatch(locked,/id="read-course"/);
});
test('topic display escapes content and never uses proof material as an example',()=>{
 const s=fresh(),c={...content,concepts:content.concepts.map(c=>c.id==='F1'?{...c,title:'<img onerror=alert(1)>',example:'secret proof'}:c),sentences:[{concept:'F1',pool:'proof',nl:'secret proof',en:'secret'},...content.sentences]};
 const html=topicPage(s,c,'F1',{today});assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img|secret proof/);
});
test('gap accepts the missing word and full sentence without independent-production credit',()=>{
 const item=content.sentences.find(s=>s.nl==='Zij studeert.');assert.ok(item);
 const q=makeExercise(item,'gap',content);
 for(const raw of ['studeert','Zij studeert','Zij studeert.','Ze studeert.']){const r=assess(q,raw);assert.equal(r.grammar,true,raw);assert.equal(r.spelling,true,raw);assert.equal(r.independent,false,raw);assert.equal(correctiveFeedback(q,item,raw,r).differences.length,0);}
 const lower=assess(q,'zij studeert');assert.equal(lower.grammar,true);assert.equal(lower.capitalization,false);
 assert.equal(assess(q,'studeert').capitalization,null);
});
test('gap validates every supplied word and feedback compares corresponding words',()=>{
 const item=content.sentences.find(s=>s.nl==='Zij studeert.'),q=makeExercise(item,'gap',content);
 for(const raw of ['Wij studeert','Zij studeren','Zij studeert vandaag','Studeert zij'])assert.notEqual(assess(q,raw).grammar,true,raw);
 const r=assess(q,'Zij studeren'),f=correctiveFeedback(q,item,'Zij studeren',r);
 assert.deepEqual(f.differences,['studeren → studeert']);assert.equal(f.words[0].changed,false);assert.equal(f.words[1].changed,true);
 assert.deepEqual(correctiveFeedback(q,item,'Wij studeert',assess(q,'Wij studeert')).differences,['Wij → Zij']);
});
test('gap full-sentence typos retain word-specific evidence, including legacy pending questions',()=>{
 const item=content.sentences.find(s=>s.nl==='Wij schrijven.'&&s.pool==='practice');const s=fresh(),q=makeExercise(item,'gap',content);s.pending=q;
 const rec=submit(s,content,q.id,'Wij schijven.',now);
 assert.equal(rec.grammar,true);assert.equal(rec.spelling,false);assert.equal(rec.kind,'gap');assert.equal(rec.independent,false);assert.ok(rec.wordEvidence.failed.includes('schrijven'));
 const q2=makeExercise(item,'gap',content);delete q2.presentationVersion;s.pending=q2;
 const correct=submit(s,content,q2.id,'Wij schrijven.',now);assert.equal(correct.grammar,true);assert.equal(correct.spelling,true);
});
test('old success flags alone cannot classify an attempt as independent or supported',()=>{
 const s=fresh();s.attempts=[attempt({assisted:undefined,independent:true}),attempt()];
 const p=learningProgress(s,{today});assert.equal(p.independent,1);assert.equal(p.supported,0);assert.equal(p.unclassified,1);
});
test('retention evidence in legacy records is not relabelled as an untouched lesson',()=>{
 const s=fresh();s.progress.F1.masteredAt='2026-09-01';s.progress.F1.status='mastered';
 const c=courseOutline(s,content,{today});assert.equal(c.topics[0].status,'mastered');assert.equal(c.current.id,'F2');
});
