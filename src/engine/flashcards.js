const finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const cleanText = value => String(value ?? '').trim();

export const PRODUCTION_STAGE = Object.freeze({
  RECOGNITION: 'recognition',
  SUPPORTED: 'supported-production',
  GUIDED: 'guided-production',
  INDEPENDENT: 'independent-production',
  CONTEXTUAL: 'contextual-production'
});

export const FLASHCARD_RATINGS = Object.freeze(['again','hard','good','easy']);

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

export function buildFlashcardQueue(cards = [], { today, newLimit = 0, random = Math.random } = {}) {
  if (!today) throw new Error('Queue requires a study day.');
  const due = cards.filter(card => !card.suspended && card.type !== 'new' && card.due_date && String(card.due_date).slice(0,10) <= today);
  const fresh = cards.filter(card => !card.suspended && card.type === 'new')
    .sort((a,b)=>Number(a.id)-Number(b.id))
    .slice(0,Math.max(0,Math.trunc(finiteNumber(newLimit))));
  return [...due,...fresh].map(card=>({...card})).sort(()=>random()-0.5);
}

export function applyFlashcardRating(cardRow, rating, { today, nowIso } = {}) {
  const chosen=String(rating||'').toLowerCase();
  if(!FLASHCARD_RATINGS.includes(chosen))throw new Error('Unknown flashcard rating.');
  if(!today)throw new Error('Rating requires a study day.');
  const card={...cardRow};
  const wasNew=card.type==='new';
  card.reps=Math.max(0,Math.trunc(finiteNumber(card.reps)))+1;
  card.lapses=Math.max(0,Math.trunc(finiteNumber(card.lapses)));
  card.interval=Math.max(0,finiteNumber(card.interval));
  card.ease=Math.max(1.3,finiteNumber(card.ease,2.5));
  let requeue=false;

  if(wasNew){
    if(chosen==='again'){
      card.interval=0;card.ease=2.5;requeue=true;
    }else{
      card.first_seen=today;card.type='review';
      if(chosen==='hard'){card.interval=1;card.ease=2.35;}
      if(chosen==='good'){card.interval=2;card.ease=2.5;}
      if(chosen==='easy'){card.interval=4;card.ease=2.65;}
    }
  }else if(chosen==='again'){
    card.lapses+=1;card.interval=1;card.ease=Math.max(1.3,card.ease-0.2);requeue=true;
  }else{
    let multiplier=1,easeChange=0;
    if(chosen==='hard'){multiplier=1.2;easeChange=-0.15;}
    if(chosen==='good'){multiplier=card.ease;}
    if(chosen==='easy'){multiplier=card.ease*1.15;easeChange=0.15;}
    let next=Math.round((card.interval+1)*multiplier);
    if(next<=card.interval)next=card.interval+1;
    card.interval=next;card.ease=Math.max(1.3,card.ease+easeChange);
  }

  const due=new Date(`${today}T12:00:00`);due.setDate(due.getDate()+card.interval);
  card.due_date=`${due.getFullYear()}-${String(due.getMonth()+1).padStart(2,'0')}-${String(due.getDate()).padStart(2,'0')}`;
  card.last_reviewed=today;

  return {
    card,
    requeue,
    leech:!wasNew&&chosen==='again'&&card.lapses>=7&&!card.suspended,
    history:{
      cardid:card.id,
      rating:chosen,
      timestamp:nowIso||new Date().toISOString(),
      reps:card.reps,
      lapses:card.lapses,
      interval:card.interval,
      ease:card.ease,
      review_type:wasNew?'new':'review'
    }
  };
}
