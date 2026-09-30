import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {questionHeader,answerFeedback} from '../src/ui/learning-session-ui.js';

test('the Learning UI helper is cached for installed offline sessions',()=>{
 const serviceWorker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(serviceWorker,/\.\/src\/ui\/learning-session-ui\.js/);
});

test('daily, proof, and extra question headers show the correct finite count',()=>{
 const question={phase:'practice'};
 const daily=questionHeader({question,dailyCount:6,topicTitle:'Subject + verb'});
 assert.match(daily,/Learning · 7 \/ 20/);
 assert.match(daily,/aria-valuenow="6"/);
 assert.match(daily,/Subject \+ verb/);
 assert.match(daily,/aria-label="Pause; progress is saved"/);
 assert.doesNotMatch(daily,/practice|Test rules/i);
 const proof=questionHeader({question:{phase:'mastery'},dailyCount:8,proof:{type:'mastery',index:2,questions:Array(20)},topicTitle:'Subject + verb'});
 assert.match(proof,/Mastery test · 3 \/ 20/);
 assert.match(proof,/Pass with 19\/20 grammar overall and at least 9\/10 in each direction/);
 assert.match(proof,/No word help is available/);
 const extra=questionHeader({question:{phase:'extra'},dailyCount:19,extraIndex:2,extraSize:8,topicTitle:'Subject + verb'});
 assert.match(extra,/Extra practice · 2 \/ 8/);
 assert.match(extra,/Does not use today’s 20/);
});

test('feedback keeps the teaching context visible and folds detailed evidence',()=>{
 const feedback={words:[{text:'Zij',changed:false},{text:'schrijft',changed:true},{text:'thuis',changed:false}],punctuation:'.',meaning:'She writes at home.',differences:['schrijtt → schrijft'],explanation:'Match the verb to the subject.'};
 const html=answerFeedback({grammar:true,spelling:false,capitalization:true,assisted:true,independent:false},feedback);
 assert.match(html,/Grammar correct · spelling to revisit/);
 assert.match(html,/Zij <mark class="problem-char">schrijft<\/mark> thuis\./);
 assert.match(html,/She writes at home/);
 assert.match(html,/Match the verb to the subject/);
 assert.match(html,/<details class="session-evidence"><summary>How this answer counts<\/summary>/);
 assert.match(html,/Guidance used/);
 assert.match(html,/does not count as independent Dutch writing/);
 assert.doesNotMatch(html,/Independent Dutch writing<\/span>/);
});
