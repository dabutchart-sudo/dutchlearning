import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const styles=readFileSync(new URL('../src/ui/styles.css',import.meta.url),'utf8');
const polish=readFileSync(new URL('../src/ui/mobile-polish.css',import.meta.url),'utf8');
const refinements=readFileSync(new URL('../src/ui/mobile-flashcard-refinements.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('mobile shell stays inside the viewport while tabs scroll independently',()=>{
  assert.match(styles,/html,body\{max-width:100%;overflow-x:hidden\}/);
  assert.match(styles,/\.app,\.topbar,#content,\.stack,\.home-grid,\.course-grid,\.evidence,\.session,\.card\{min-width:0;max-width:100%\}/);
  assert.match(styles,/@media\(max-width:900px\)\{\.topbar\{align-items:flex-start;flex-direction:column\}/);
  assert.match(styles,/\.tabs\{display:flex;width:100%;align-self:stretch;overflow-x:auto;overflow-y:hidden/);
  assert.match(styles,/\.tab\{flex:0 0 auto;min-width:max-content\}/);
});

test('mobile flashcards use compact icon controls and robust speech wiring',()=>{
  assert.match(polish,/flashcard-listen::before/);
  assert.match(polish,/flashcard-tool-row button::before/);
  assert.match(refinements,/Listen to Dutch pronunciation/);
  assert.match(refinements,/speak\(text/);
});

test('flashcard Listen speaks the Dutch word without the part-of-word label',()=>{
  assert.match(refinements,/cloneNode\(true\)/);
  assert.match(refinements,/querySelector\?\.\('\.flashcard-part'\)\?\.remove\(\)/);
  assert.match(refinements,/spoken\.textContent/);
});

test('mobile header metadata moves into the top-right area',()=>{
  assert.match(polish,/\.brand p\{position:absolute;top:5px;right:0/);
});

test('mobile polish remains shipped in the current build',()=>{
  assert.match(index,/V5\.1\.106/);
  assert.match(index,/mobile-polish\.css\?v=5\.1\.106/);
  assert.match(index,/mobile-flashcard-refinements\.js\?v=5\.1\.106/);
});
