import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const styles=readFileSync(new URL('../src/ui/styles.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('mobile shell stays inside the viewport while tabs scroll independently',()=>{
  assert.match(styles,/html,body\{max-width:100%;overflow-x:hidden\}/);
  assert.match(styles,/\.app,\.topbar,#content,\.stack,\.home-grid,\.course-grid,\.evidence,\.session,\.card\{min-width:0;max-width:100%\}/);
  assert.match(styles,/@media\(max-width:900px\)\{\.topbar\{align-items:flex-start;flex-direction:column\}/);
  assert.match(styles,/\.tabs\{display:flex;width:100%;align-self:stretch;overflow-x:auto;overflow-y:hidden/);
  assert.match(styles,/\.tab\{flex:0 0 auto;min-width:max-content\}/);
});

test('mobile overflow fix is shipped in V5.1.99',()=>{
  assert.match(index,/V5\.1\.99/);
  assert.match(index,/styles\.css\?v=5\.1\.99/);
});
