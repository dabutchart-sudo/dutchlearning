# Flashcard integration

The standalone Flashcards application is being absorbed into Dutch Learning. This migration is deliberately additive until the replacement has been exercised against real learner data.

## Product invariants

- Flashcards remain a dedicated daily destination and a complete batch, not a background feature.
- The daily new-card setting is a hard ceiling. Review-load policy may reduce it but must never increase it.
- Completing the flashcard study day closes that day. No additional new cards may appear until the next study day.
- Existing Supabase `cards` scheduling values and `reviewhistory` remain authoritative during migration. The new app must not silently recalculate intervals, ease, reps or lapses.
- Existing reporting remains first-class: retention, activity, mastered cards, rating breakdown, trouble words and interval distribution.
- Sentence Trainer word evidence may enrich a card, but it must not overwrite SRS history.
- English-to-Dutch production progresses per word from recognition to supported, guided, independent and contextual production.
- AI is optional tutoring/generation infrastructure, not part of deterministic SRS scoring.
- Provider secrets never live in browser JavaScript or GitHub Pages. AI calls go through an authenticated server-side function and generated content is cached.
- The standalone Flashcards app remains available until the merged experience is validated and migration is reversible.

## Phase 1 domain boundary

`src/engine/flashcards.js` introduces a shared vocabulary view that normalizes rows from the existing `cards` table without changing their SRS values. It also combines those rows with Sentence Trainer word evidence in a separate `evidence` object.

`src/engine/integrations.js` now defines explicit adapter boundaries for flashcard persistence and server-side sentence generation. No credentials or network clients are introduced by this phase.

The first regression tests lock the most important migration behaviours: preservation of SRS fields, the strict new-card ceiling, no extra new cards after daily completion, the existing >21-day mastered definition, and retention excluding new-card introductions.

## Next implementation slice

1. Connect the adapter to the existing Supabase cards/review-history data using the same authenticated account model as the current Flashcards app.
2. Build a read-only Flashcards screen inside Dutch Learning and compare its due counts/reporting with the standalone app.
3. Only after parity is demonstrated, move review writes/SRS queue execution into Dutch Learning.
4. Add the rotating sentence bank and OpenAI-backed generation through a server-side function.
5. Introduce supported English-to-Dutch production per word using shared evidence.
