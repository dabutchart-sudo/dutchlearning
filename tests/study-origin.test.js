import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyOrigin,environmentPresentation} from '../src/engine/study-origin.js';

const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/ui/styles.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/ui/app.js',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/ui/study-origin.js',import.meta.url),'utf8');
const docs=readFileSync(new URL('../DEVELOPMENT.md',import.meta.url),'utf8');
const design=readFileSync(new URL('../DESIGN.md',import.meta.url),'utf8');

test('only GitHub Pages is the genuine study origin',()=>{
 assert.equal(classifyOrigin('dabutchart-sudo.github.io'),'production');
 assert.equal(classifyOrigin('localhost'),'development');
 assert.equal(classifyOrigin('127.0.0.1'),'development');
 assert.equal(classifyOrigin('192.168.1.20'),'development');
 assert.equal(classifyOrigin('10.0.0.4'),'development');
 assert.equal(classifyOrigin(''),'development');
});

test('development presentation cannot be mistaken for production',()=>{
 const prod=environmentPresentation('dabutchart-sudo.github.io','V5.1.122');
 const local=environmentPresentation('192.168.1.20','V5.1.122');
 assert.equal(prod.genuine,true);
 assert.equal(prod.subtitle,'Sentence construction · V5.1.122');
 assert.equal(prod.banner,null);
 assert.equal(local.genuine,false);
 assert.match(local.subtitle,/Development · not for genuine study/);
 assert.match(local.banner,/GitHub Pages is the study origin/);
 assert.equal(local.appleTitle,'Zin Dev');
});

test('origin distinction is shipped, cached and documented',()=>{
 assert.match(index,/study-origin\.js\?v=5\.1\.\d+/);
 assert.match(sw,/src\/engine\/study-origin\.js/);
 assert.match(sw,/src\/ui\/study-origin\.js/);
 assert.match(css,/\.study-origin-banner\{/);
 assert.match(ui,/applyStudyOrigin\(/);
 assert.match(app,/GitHub Pages/);
 assert.match(app,/192\.168/);
 assert.match(docs,/dabutchart-sudo\.github\.io\/dutchlearning/);
 assert.match(design,/GitHub Pages is the only normal origin for genuine study/);
});

test('the Development banner stays out of the tab row so Flashcards remains usable',()=>{
 assert.match(ui,/insertAdjacentElement\('beforebegin',banner\)/);
 assert.doesNotMatch(ui,/topbar\.prepend\(banner\)/);
 assert.match(css,/body\.is-development \.tabs\{[^}]*flex:1 0 100%/);
 assert.doesNotMatch(css,/body\.is-development \.tabs\{order:1\}/);
 assert.match(css,/\.study-origin-banner\{[^}]*display:block/);
});
