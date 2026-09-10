import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_STAGE, normalizeFlashcardCard, unifiedVocabularyRecord, remainingNewCards, isMasteredFlashcard, reviewRetention, flashcardSummary } from '../src/engine/flashcards.js';

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
