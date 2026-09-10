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

## Read-only parity preview

The Dutch Learning navigation now includes a Flashcards preview. It reads the existing `cards` and `reviewhistory` tables but deliberately exposes no write operation.

During this temporary migration stage it reuses the public Supabase browser configuration already deployed by the standalone Flashcards PWA. This avoids duplicating configuration while the old app remains authoritative. Before that app is retired, Dutch Learning will own this configuration directly.

The preview shows reviews due, new cards available after the current retention/review-load governor, today's completed reviews, 30-day retention, mastered/active/suspended/total counts, trouble words, and the existing persisted done-for-today lock.

The next checkpoint is live parity: compare those figures with the standalone Flashcards app using the same dataset. Only after they agree should rating controls and Supabase review writes be enabled in Dutch Learning.
