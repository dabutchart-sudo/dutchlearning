import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dailyProofOffer,freshState,releaseUnscoredPractice} from '../src/engine/learner.js';

function contentFixture(){
 const concept={id:'F1',level:'Foundation',title:'First sentences',rule:'A simple rule.',example:'Ik werk.',translation:'I work.',exampleId:'p1',prerequisites:[],minPractice:40};
 const item={id:'p1',concept:'F1',pool:'practice',nl:'Ik werk.',en:'I work.',alternatives:[],verb:'werken',subject:'ik',family:'present',verbIndex:1,verbSlots:[1],forms:['werk','werkt','werken'],vocabulary:[{id:'w1',nl:'werken',en:'to work',mature:false}]};
 return {concepts:[concept],sentences:[item],conceptById:{F1:concept},byId:{p1:item}};
}

const content=contentFixture();
const now=new Date('2026-09-21T12:00:00');
const ready=(status='proof-ready',count=0,pending=false)=>{
 const s=freshState(content,now);
 s.progress.F1.status=status;
 s.progress.F1.practiceAttempts=40;
 s.daily={date:'2026-09-21',count};
 if(pending)s.pending={id:'q1',phase:'practice',kind:'typed',sourceId:'p1'};
 return s;
};

test('a ready mastery test can use today even if an unanswered practice question is pending',()=>{
 const offer=dailyProofOffer(ready('proof-ready',0,true),content,now);
 assert.equal(offer.type,'mastery');
 assert.equal(offer.canStartToday,true);
 assert.equal(offer.needed,20);
});

test('mastery cannot start after any of today’s 20 has been used',()=>{
 const offer=dailyProofOffer(ready('proof-ready',1),content,now);
 assert.equal(offer.canStartToday,false);
 assert.match(offer.reason,/next study day/);
});

test('retention can still start when ten questions remain',()=>{
 const offer=dailyProofOffer(ready('retention-ready',10),content,now);
 assert.equal(offer.type,'retention');
 assert.equal(offer.canStartToday,true);
 assert.equal(offer.needed,10);
});

test('ordinary practice is not offered as a daily proof',()=>{
 assert.equal(dailyProofOffer(freshState(content,now),content,now),null);
});

test('starting a proof can drop an unscored practice question',()=>{
 const s=ready('proof-ready',0,true);
 releaseUnscoredPractice(s);
 assert.equal(s.pending,null);
});

test('the path and practice warn before a ready test uses the day',()=>{
 const source=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 assert.match(source,/dailyProofOffer/);
 assert.match(source,/Take the \$\{title\} before practice/);
 assert.match(source,/Practice anyway/);
 assert.match(source,/releaseUnscoredPractice/);
});

test('the mastery vocabulary reminder keeps Ready start the test on a pinned action row',()=>{
 const source=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
 const refinements=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
 assert.match(source,/Before your \$\{type\} test/);
 assert.match(source,/session-briefing/);
 assert.match(source,/class="actions">\$\{button\('begin-proof','Ready — start the test'\)/);
 assert.doesNotMatch(source,/evidence-card"><span class="direction">Vocabulary reminder/);
 assert.match(refinements,/question-card\.session-briefing\{min-height:0\}/);
});
