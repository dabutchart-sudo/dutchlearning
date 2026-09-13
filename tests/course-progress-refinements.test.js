import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync(new URL('../src/ui/course-progress-refinements.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/ui/course-progress-refinements.css',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');

test('Today explains practice progress and the next proof milestone',()=>{
  assert.match(ui,/40-attempts/);
  assert.match(ui,/more practice/);
  assert.match(ui,/mastery proof/);
  assert.match(ui,/Retention pending/);
  assert.match(ui,/next concept remains locked/);
  assert.match(ui,/tomorrow continues from this point/);
});

test('course progress treatment is mobile friendly and shipped offline',()=>{
  assert.match(css,/course-progress-track/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(index,/course-progress-refinements\.css\?v=5\.1\.102/);
  assert.match(index,/course-progress-refinements\.js\?v=5\.1\.102/);
  assert.match(index,/Zin · V5\.1\.102/);
  assert.match(sw,/dutch-v5\.1\.102/);
  assert.match(sw,/course-progress-refinements\.js/);
  assert.match(sw,/course-progress-refinements\.css/);
});
