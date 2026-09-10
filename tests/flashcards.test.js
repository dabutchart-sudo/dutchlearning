import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { PRODUCTION_STAGE, normalizeFlashcardCard, unifiedVocabularyRecord, remainingNewCards, isMasteredFlashcard, reviewRetention, flashcardSummary, buildFlashcardQueue, applyFlashcardRating } from '../src/engine/flashcards.js';

const card = overrides => ({
  id: 42,
  dutch: 'schrijven',
  english: 'to write',
  partofword: 'verb',
  type: 'review',
  interval: 30,
  ease: 2.4,
  reps: 8,
  lapses: 2,
  first_seen: '2026-08-01',
  last_reviewed: '2026-09-09',
  due_date: '2026-10-09',
  suspended: false,
  dutch_sentence: 'Ik schrijf elke dag.',
  english_sentence: 'I write every day.',
  image_url: '',
  ...overrides
});

test('normalizes existing card rows without recalculating SRS values', () => {
  const result = normalizeFlashcardCard(card());
  assert.equal(result.id, '42');
  assert.equal(result.dutch, 'schrijven');
  assert.equal(result.partOfWord, 'verb');
  assert.equal(result.srs.interval, 30);
  assert.equal(result.srs.ease, 2.4);
  assert.equal(result.example.dutch, 'Ik schrijf elke dag.');
});

test('combines flashcard and learner evidence without overwriting either source', () => {
  const result = unifiedVocabularyRecord(card(), {
    weakness: 3,
    spellingErrors: 4,
    independentSuccesses: 1,
    productionStage: PRODUCTION_STAGE.GUIDED
  });
  assert.equal(result.srs.interval, 30);
  assert.equal(result.evidence.weakness, 3);
  assert.equal(result.evidence.spellingErrors, 4);
  assert.equal(result.evidence.productionStage, 'guided-production');
});

test('configured new-card setting remains a hard ceiling', () => {
  assert.equal(remainingNewCards({ configuredMax: 5, loadCap: 10, introducedToday: 0 }), 5);
  assert.equal(remainingNewCards({ configuredMax: 5, loadCap: 3, introducedToday: 0 }), 3);
  assert.equal(remainingNewCards({ configuredMax: 5, loadCap: 5, introducedToday: 2 }), 3);
});

test('completed flashcard study day offers no extra new cards', () => {
  assert.equal(remainingNewCards({ configuredMax: 5, introducedToday: 1, studyDayComplete: true }), 0);
});

test('mastery retains the current greater-than-21-day rule', () => {
  assert.equal(isMasteredFlashcard(card({ interval: 22 })), true);
  assert.equal(isMasteredFlashcard(card({ interval: 21 })), false);
  assert.equal(isMasteredFlashcard(card({ interval: 30, suspended: true })), false);
});

test('retention excludes new introductions and counts Again as incorrect', () => {
  const result = reviewRetention([
    { review_type: 'new', rating: 'Good' },
    { review_type: 'review', rating: 'Good' },
    { review_type: 'review', rating: 'Again' },
    { review_type: 'review', rating: 'Easy' }
  ]);
  assert.deepEqual(result, { correct: 2, total: 3, rate: 2 / 3 });
});

test('summary preserves dedicated flashcard reporting measures', () => {
  const result = flashcardSummary([
    card({ id: 1, interval: 30 }),
    card({ id: 2, interval: 5 }),
    card({ id: 3, interval: 40, suspended: true })
  ], [
    { review_type: 'review', rating: 'Good' },
    { review_type: 'review', rating: 'Again' }
  ]);
  assert.equal(result.total, 3);
  assert.equal(result.active, 2);
  assert.equal(result.suspended, 1);
  assert.equal(result.mastered, 1);
  assert.equal(result.retention.rate, 0.5);
});

test('queue contains all due reviews plus only the allowed earliest new cards', () => {
  const queue=buildFlashcardQueue([
    card({id:1,due_date:'2026-09-10'}),
    card({id:2,due_date:'2026-09-11'}),
    card({id:10,type:'new',due_date:null}),
    card({id:4,type:'new',due_date:null}),
    card({id:5,type:'new',due_date:null,suspended:true})
  ],{today:'2026-09-10',newLimit:1,random:()=>0.5});
  assert.deepEqual(queue.map(x=>x.id),[1,4]);
});

test('new Again stays new and requeues with the same parity fields', () => {
  const result=applyFlashcardRating(card({type:'new',interval:0,ease:2.5,reps:0,lapses:0,first_seen:null}), 'again', {today:'2026-09-10',nowIso:'2026-09-10T14:00:00.000Z'});
  assert.equal(result.card.type,'new');
  assert.equal(result.card.interval,0);
  assert.equal(result.card.ease,2.5);
  assert.equal(result.card.reps,1);
  assert.equal(result.card.first_seen,null);
  assert.equal(result.requeue,true);
  assert.equal(result.history.review_type,'new');
});

test('new Good graduates to two days and sets first seen', () => {
  const result=applyFlashcardRating(card({type:'new',interval:0,ease:2.5,reps:0,lapses:0,first_seen:null}), 'good', {today:'2026-09-10'});
  assert.equal(result.card.type,'review');
  assert.equal(result.card.interval,2);
  assert.equal(result.card.ease,2.5);
  assert.equal(result.card.first_seen,'2026-09-10');
  assert.equal(result.card.due_date,'2026-09-12');
  assert.equal(result.requeue,false);
});

test('review Again resets to one day, reduces ease and increments lapses', () => {
  const result=applyFlashcardRating(card({interval:30,ease:2.4,lapses:2}), 'again', {today:'2026-09-10'});
  assert.equal(result.card.interval,1);
  assert.ok(Math.abs(result.card.ease-2.2)<Number.EPSILON*4);
  assert.equal(result.card.lapses,3);
  assert.equal(result.card.due_date,'2026-09-11');
  assert.equal(result.requeue,true);
  assert.equal(result.history.review_type,'review');
});

test('review Good uses current ease and guarantees growth', () => {
  const result=applyFlashcardRating(card({interval:10,ease:2.5}), 'good', {today:'2026-09-10'});
  assert.equal(result.card.interval,28);
  assert.equal(result.card.ease,2.5);
  assert.equal(result.card.due_date,'2026-10-08');
});

test('front screen displays the package version', () => {
  const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(html.includes(`V${pkg.version}`),`Expected front screen to show V${pkg.version}`);
});
