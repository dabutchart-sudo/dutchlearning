const finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const cleanText = value => String(value ?? '').trim();

export const PRODUCTION_STAGE = Object.freeze({
  RECOGNITION: 'recognition',
  SUPPORTED: 'supported-production',
  GUIDED: 'guided-production',
  INDEPENDENT: 'independent-production',
  CONTEXTUAL: 'contextual-production'
});

export function normalizeFlashcardCard(row) {
  if (!row || row.id === undefined || row.id === null) throw new Error('Flashcard is missing an id.');
  const dutch = cleanText(row.dutch);
  const english = cleanText(row.english);
  if (!dutch || !english) throw new Error(`Flashcard ${row.id} needs both Dutch and English text.`);

  return {
    id: String(row.id),
    dutch,
    english,
    partOfWord: cleanText(row.partofword),
    example: {
      dutch: cleanText(row.dutch_sentence),
      english: cleanText(row.english_sentence),
      imageUrl: cleanText(row.image_url)
    },
    srs: {
      type: cleanText(row.type) || 'new',
      interval: Math.max(0, finiteNumber(row.interval)),
      ease: Math.max(0, finiteNumber(row.ease, 2.5)),
      reps: Math.max(0, Math.trunc(finiteNumber(row.reps))),
      lapses: Math.max(0, Math.trunc(finiteNumber(row.lapses))),
      firstSeen: row.first_seen ?? null,
      lastReviewed: row.last_reviewed ?? null,
      dueDate: row.due_date ?? null,
      suspended: Boolean(row.suspended)
    }
  };
}

export function unifiedVocabularyRecord(cardRow, wordEvidence = {}) {
  const card = normalizeFlashcardCard(cardRow);
  return {
    ...card,
    evidence: {
      taughtAt: wordEvidence.taughtAt ?? null,
      weakness: Math.max(0, finiteNumber(wordEvidence.weakness)),
      attempts: Math.max(0, Math.trunc(finiteNumber(wordEvidence.attempts))),
      spellingErrors: Math.max(0, Math.trunc(finiteNumber(wordEvidence.spellingErrors))),
      recallErrors: Math.max(0, Math.trunc(finiteNumber(wordEvidence.recallErrors))),
      supportedEncounters: Math.max(0, Math.trunc(finiteNumber(wordEvidence.supportedEncounters))),
      independentSuccesses: Math.max(0, Math.trunc(finiteNumber(wordEvidence.independentSuccesses))),
      productionStage: wordEvidence.productionStage || PRODUCTION_STAGE.RECOGNITION
    }
  };
}

export function remainingNewCards({ configuredMax = 5, loadCap = null, introducedToday = 0, studyDayComplete = false } = {}) {
  if (studyDayComplete) return 0;
  const configured = Math.max(0, Math.trunc(finiteNumber(configuredMax, 5)));
  const reduced = loadCap === null || loadCap === undefined
    ? configured
    : Math.min(configured, Math.max(0, Math.trunc(finiteNumber(loadCap))));
  return Math.max(0, reduced - Math.max(0, Math.trunc(finiteNumber(introducedToday))));
}

export function isMasteredFlashcard(cardRow, masteryIntervalDays = 21) {
  const card = normalizeFlashcardCard(cardRow);
  return !card.srs.suspended && card.srs.type !== 'new' && card.srs.interval > masteryIntervalDays;
}

export function reviewRetention(history = []) {
  const reviews = history.filter(record => record && record.review_type !== 'new');
  if (!reviews.length) return { correct: 0, total: 0, rate: null };
  const correct = reviews.filter(record => String(record.rating ?? '').toLowerCase() !== 'again').length;
  return { correct, total: reviews.length, rate: correct / reviews.length };
}

export function flashcardSummary(cards = [], history = []) {
  const normalized = cards.map(normalizeFlashcardCard);
  return {
    total: normalized.length,
    active: normalized.filter(card => !card.srs.suspended).length,
    suspended: normalized.filter(card => card.srs.suspended).length,
    mastered: cards.filter(card => isMasteredFlashcard(card)).length,
    retention: reviewRetention(history)
  };
}
