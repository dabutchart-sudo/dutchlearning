import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {proofResultHeadline,proofResultIsToday,proofResultLabel,proofResultScore,proofResultSummary} from '../src/ui/proof-result.js';

const pass={type:'mastery',concept:'F1',passed:true,correct:20,total:20,studyDate:'2026-10-04',directions:{'nl-en':{correct:10,total:10},'en-nl':{correct:10,total:10}}};
const missed={type:'mastery',concept:'F1',passed:false,correct:18,total:20,studyDate:'2026-10-04',directions:{'nl-en':{correct:9,total:10},'en-nl':{correct:9,total:10}}};
const retention={type:'retention',concept:'F1',passed:true,correct:10,total:10,completedAt:'2026-10-07T12:00:00.000Z',directions:{'nl-en':{correct:5,total:5},'en-nl':{correct:5,total:5}}};

test('a finished mastery test states the outcome and both directions',()=>{
 assert.equal(proofResultLabel(pass),'F1 mastery test');
 assert.equal(proofResultHeadline(pass),'You passed');
 assert.equal(proofResultHeadline(missed),'This test was not passed');
 assert.match(proofResultScore(pass),/20 of 20 answers were correct/);
 assert.match(proofResultScore(pass),/Dutch to English: 10 of 10/);
 assert.match(proofResultScore(pass),/English to Dutch: 10 of 10/);
 assert.match(proofResultScore(pass),/19 of 20/);
 assert.match(proofResultScore(missed),/18 of 20 answers were correct/);
 assert.equal(proofResultSummary(pass),'F1 mastery test: Passed, 20 of 20');
 assert.equal(proofResultSummary(missed),'F1 mastery test: Not passed, 18 of 20');
});

test('today’s result is announced immediately and an older result keeps its outcome visible',()=>{
 assert.equal(proofResultIsToday(pass,'2026-10-04'),true);
 assert.equal(proofResultIsToday(pass,'2026-10-05'),false);
 assert.equal(proofResultLabel(retention),'F1 retention test');
 assert.match(proofResultScore(retention),/10 of 10 answers were correct/);
 assert.match(proofResultScore(retention),/A retention test passes at 10 of 10/);
 assert.equal(proofResultIsToday(retention,'2026-10-07'),true);
 const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(app,/course-proof-announcement/);
 assert.match(app,/beforebegin/);
 assert.match(app,/proofResultSummary/);
 assert.doesNotMatch(app,/Grammar proven in both directions|Latest test result/);
 assert.match(sw,/proof-result\.js/);
});
