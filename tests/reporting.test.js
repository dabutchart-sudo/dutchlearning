import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {REPORT_RANGES,dailyActivity,dailyRetention,ratingBreakdown,upcomingReviews,cardStatus,reportSummary} from '../src/engine/reporting.js';
const now=new Date('2026-09-13T12:00:00');
const history=[
 {timestamp:'2026-09-13T08:00:00',review_type:'new',rating:'good'},
 {timestamp:'2026-09-13T08:01:00',review_type:'review',rating:'good'},
 {timestamp:'2026-09-13T08:02:00',review_type:'review',rating:'again'},
 {timestamp:'2026-09-12T08:00:00',review_type:'review',rating:'easy'},
 {timestamp:'2026-06-01T08:00:00',review_type:'review',rating:'hard'}
];
const cards=[{type:'new',suspended:false},{type:'review',interval:5,due_date:'2026-09-13',suspended:false},{type:'review',interval:30,due_date:'2026-09-15',suspended:false},{type:'review',interval:3,due_date:'2026-09-01',suspended:false},{type:'review',interval:50,due_date:'2026-09-20',suspended:true}];
test('report keeps the four original time filters',()=>assert.deepEqual(REPORT_RANGES.map(x=>x.value),['7','30','90','all']));
test('daily study load separates new cards from reviews',()=>{const rows=dailyActivity(history,'7',now);assert.deepEqual(rows.at(-1),{date:'2026-09-13',new:1,reviewed:2,total:3});});
test('recall excludes new-card introductions',()=>{const rows=dailyRetention(history,'7',now);assert.equal(rows.at(-1).total,2);assert.equal(rows.at(-1).rate,.5);const ratings=ratingBreakdown(history,'7',now);assert.equal(ratings.total,3);assert.equal(ratings.counts.good,1);});
test('current progress and future load use current card truth',()=>{assert.deepEqual(cardStatus(cards),{new:1,learning:2,mature:1,suspended:1});const future=upcomingReviews(cards,7,now);assert.equal(future[0].count,2);assert.equal(future[2].count,1);});
test('summary exposes high-value headline metrics',()=>{const s=reportSummary(cards,history,'7',now);assert.equal(s.total,4);assert.equal(s.newCards,1);assert.equal(s.reviewed,3);assert.equal(s.retention,2/3);assert.equal(s.mature,1);});
test('report UI stacks daily load, protects panel headings and labels upcoming counts',()=>{const css=readFileSync(new URL('../src/ui/reporting.css',import.meta.url),'utf8');const ui=readFileSync(new URL('../src/ui/reporting.js',import.meta.url),'utf8');assert.match(css,/report-bar-stack\{[^}]*flex-direction:column-reverse/);assert.match(css,/report-card\{[^}]*padding:/);assert.match(ui,/report-bar-value/);assert.match(ui,/bars\(future,\['count'\],\{labels:true\}\)/);});
