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

`src/engine/integrations.js` defines explicit adapter boundaries for flashcard persistence and server-side sentence generation. Provider credentials remain outside the deterministic learning engine.

The first regression tests lock the most important migration behaviours: preservation of SRS fields, the strict new-card ceiling, no extra new cards after daily completion, the existing >21-day mastered definition, and retention excluding new-card introductions.

## Live Flashcard migration

The Dutch Learning navigation now includes a Flashcards destination using the existing `cards` and `reviewhistory` data. It preserves the full daily SRS batch, live Again/Hard/Good/Easy writes, requeue behaviour and the persisted done-for-today lock.

During this temporary migration stage it reuses the public Supabase browser configuration already deployed by the standalone Flashcards PWA. This avoids duplicating configuration while the old app remains available. Before the standalone app is retired, Dutch Learning will own this configuration directly.

The current dashboard shows due/new counts, today's completed reviews, 30-day retention, mastered/active/suspended/total counts, trouble words and English-to-Dutch readiness.

## English-to-Dutch production bridge

Mature cards are staged conservatively through recognition, supported production, guided production, independent production and contextual production. Production practice is a separate optional mini-session capped at five meaningful questions per day. It writes learner evidence only and never changes Flashcard SRS intervals or due dates.

Supported words use multiple choice. Guided multi-word phrases use shuffled word tiles. Guided single words use partial-spelling recall rather than a one-tile giveaway. Meaningless legacy attempts from the V5.1.8 prototype are excluded from the daily allowance and learning evidence.

## Contextual sentence-bank groundwork

V5.1.12 adds `src/engine/sentence-bank.js` as the deterministic cache/rotation layer for contextual examples. A card's current Dutch/English example remains the fallback, generated and cached examples are deduplicated, banks are capped at ten examples, and rotation avoids recently shown sentence IDs where alternatives exist.

The engine requests refresh when a bank contains fewer than five examples. Dated generated banks can also become refresh candidates after 30 days. This layer does not call an AI provider itself; generation remains behind `SentenceGeneratorAdapter` and an authenticated server-side function.

The next sentence-bank checkpoint is to connect the existing authenticated `generate-sentences` Edge Function to this cache boundary, then surface varied examples without making an API call every time a card appears.
