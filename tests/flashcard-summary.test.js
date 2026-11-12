import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/ui/flashcards-preview.js',import.meta.url),'utf8');
const renderSource=source.slice(source.indexOf('function render(data)'),source.indexOf('\nfunction ',source.indexOf('function render(data)')+1));
function summary(overrides={}){
 const contentEl={innerHTML:''};
 const c={today:'2026-11-12',cfg:{maxNew:5},dueReview:136,dueNew:0,complete:false,maxNew:0,budget:{remaining:60},...overrides};
 const context={contentEl,counts:()=>c,rangeHistory:()=>[],flashcardSummary:()=>({retention:{},mastered:0}),dayKey:()=>c.today,troubleWords:()=>[],learnerState:()=>({}),productionReadiness:()=>({counts:{}}),PRODUCTION_STAGE:{},productionAttemptsToday:()=>0,PRODUCTION_DAILY_LIMIT:5,productionPracticeQueue:()=>[],percent:()=>'',esc:x=>x,allowanceSummary:()=> 'Allowance explanation',courseIntakeNote:()=>'<p>Course details</p>',startSession:()=>{},startProduction:()=>{},document:{createElement:()=>({}),getElementById:()=>({after:()=>{},addEventListener:()=>{}})},paintDailyChrome:()=>{}};
 vm.runInNewContext(`(${renderSource})({cards:[],history:[]})`,context);
 return contentEl.innerHTML.split('</article>')[0];
}
test('summary keeps action before collapsed explanations and removes live-data badge',()=>{
 const html=summary();
 assert.match(html,/Today’s reviews<\/span><span class="n">60/);
 assert.match(html,/Done today<\/span><span class="n">0/);
 assert.match(html,/No new cards today while you catch up/);
 assert.doesNotMatch(html,/Live data|DAILY FLASHCARD SRS|<details[^>]* open/);
 assert.ok(html.indexOf('Start reviews')<html.indexOf('<summary>Session details'));
 assert.ok(html.indexOf('Total backlog')<html.indexOf('<summary>Session details'));
 assert.ok(html.indexOf('Course details')>html.indexOf('<summary>Session details'));
});
test('completion, available new cards and empty queue retain appropriate actions',()=>{
 assert.match(summary({complete:true}),/disabled>Done for today/);
 assert.match(summary({dueNew:2,maxNew:2}),/2 new cards available today/);
 assert.match(summary({dueReview:0,dueNew:0}),/disabled>Nothing due/);
});
test('waiting course words cannot promise intake with a zero new-card allowance',()=>{
 const body=source.slice(source.indexOf('function courseIntakeNote('),source.indexOf('\nfunction flashcardsStatus'));
 const context={coursePriority:()=>({waiting:2,share:2,unmatched:[],ambiguous:[]}),courseContent:{},esc:x=>x};
 const note=vm.runInNewContext(`(${body})`,context);
 assert.doesNotMatch(note({}, {dueNew:0}),/can join/);
 assert.match(note({}, {dueNew:1}),/Up to 1 can join/);
});

test('secondary actions share a row and retain native disclosure and report navigation',()=>{
 const html=summary();
 assert.match(html,/<div class="flashcard-summary-actions"><details/);
 assert.match(html,/<summary>Session details<\/summary>/);
 assert.match(html,/id="open-flashcard-report"[^>]*>View report/);
 assert.ok(source.includes("document.getElementById('report-tab')?.click()"));
});
