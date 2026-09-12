/** Future adapters are explicit boundaries, not credentials or live network clients.
 * A sync implementation must merge immutable attempt IDs, then recompute projections
 * and enforce an account-wide daily ceiling server-side before cross-device writes.
 */
export class SyncAdapter {
 async pushAttempts(_attempts){throw new Error('Cross-device sync is not enabled in V5.');}
 async pullSince(_cursor){throw new Error('Cross-device sync is not enabled in V5.');}
}

export class TutorAdapter {
 async reviewAlternative(_request){throw new Error('AI answer review is not enabled in V5.');}
}

/**
 * Boundary for the existing Supabase flashcard data. The merged app will keep the
 * current cards/review history as the source of truth for flashcard scheduling while
 * exposing that evidence to the wider learning engine.
 */
export class FlashcardAdapter {
 async listCards(){throw new Error('Flashcard data is not connected yet.');}
 async listReviewHistory(_options={}){throw new Error('Flashcard data is not connected yet.');}
 async saveReview(_review){throw new Error('Flashcard review writes are not connected yet.');}
 async updateCard(_card){throw new Error('Flashcard card writes are not connected yet.');}
 async listSentenceBank(_cardId){throw new Error('Flashcard sentence bank is not connected yet.');}
 async saveSentenceBank(_cardId,_sentences){throw new Error('Flashcard sentence bank writes are not connected yet.');}
}

/**
 * AI generation remains server-side. Browser implementations should call an
 * authenticated backend/Edge Function and must never contain provider API secrets.
 */
export class SentenceGeneratorAdapter {
 async generateForCards(_cardIds){throw new Error('AI sentence generation is not enabled yet.');}
}
