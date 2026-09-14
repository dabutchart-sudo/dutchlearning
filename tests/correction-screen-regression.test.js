import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {practiceKind} from '../src/engine/scheduler.js';

test('the Day 1 progression reaches a correction exercise after fourteen completed practice attempts',()=>{
 const progress={recognised:4,constructed:4,weakness:0,practiceAttempts:14};
 assert.equal(practiceKind(progress,false),'correction');
});

test('correction-screen refinement does not rewrite an already-refined label from its MutationObserver',()=>{
 const source=readFileSync(new URL('../src/ui/learning-session-refinements.js',import.meta.url),'utf8');
 assert.match(source,/if\(qType\.textContent\.trim\(\)!=='Type the missing letters'\)qType\.textContent='Type the missing letters';/);
 assert.doesNotMatch(source,/\n qType\.textContent='Type the missing letters';\n/,'an unconditional textContent rewrite would retrigger the child-list MutationObserver indefinitely');
});
