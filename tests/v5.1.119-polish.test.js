import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('V5.1.119 clearly tells missing-form learners to type only the missing word',()=>{
 const ui=read('../src/ui/learning-gap-guidance.js');
 assert.match(ui,/Fill the missing form/);
 assert.match(ui,/Missing word only/);
 assert.match(ui,/Type only the word that belongs in the blank/);
 assert.doesNotMatch(ui,/Hij tekent/);
});

test('V5.1.119 restores a guarded 600ms rotating Flashcard reveal',()=>{
 const ui=read('../src/ui/flashcard-flip-animation.js');
 assert.match(ui,/FLIP_MS=600/);
 assert.match(ui,/rotateY\(90deg\)/);
 assert.match(ui,/rotateY\(-90deg\)/);
 assert.match(ui,/bypassNextClick/);
 assert.match(ui,/prefers-reduced-motion/);
 assert.match(ui,/speak-card/);
});

test('V5.1.119 loads and caches both polish modules',()=>{
 const index=read('../index.html');
 const sw=read('../sw.js');
 const pkg=JSON.parse(read('../package.json'));
 assert.equal(pkg.version,'5.1.119');
 assert.match(index,/Zin · V5\.1\.119/);
 assert.match(index,/learning-gap-guidance\.js\?v=5\.1\.119/);
 assert.match(index,/flashcard-flip-animation\.js\?v=5\.1\.119/);
 assert.match(sw,/dutch-v5\.1\.119-20260915/);
 assert.match(sw,/\.\/src\/ui\/learning-gap-guidance\.js/);
 assert.match(sw,/\.\/src\/ui\/flashcard-flip-animation\.js/);
});
