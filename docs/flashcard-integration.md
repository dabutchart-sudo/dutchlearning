# Flashcard integration

The standalone Flashcards application is being absorbed into Dutch Learning. This migration remains deliberately reversible until the integrated replacement has passed real-device and persistence verification.

V5.1.92 is the current stabilisation checkpoint. See `checkpoint-v5.1.92.md` for the verification checklist and the boundary for the next development milestone.

## Product invariants

- Flashcards remain a dedicated daily destination and a complete batch, not a background feature.
- The daily new-card setting is a hard ceiling. Review-load policy may reduce it but must never increase it.
- Completing the flashcard study day closes that day. No additional new cards may appear until the next study day.
- Existing Supabase `cards` scheduling values and `reviewhistory` remain authoritative during migration. The new app must not silently recalculate intervals, ease, reps or lapses outside the defined rating path.
- Existing reporting remains first-class: retention, activity, mastered cards, rating breakdown, trouble words and interval distribution.
- Sentence Trainer word evidence may enrich a card, but it must not overwrite SRS history.
- English-to-Dutch production progresses per word from recognition to supported, guided, independent and contextual production.
- AI is optional tutoring/generation infrastructure, not part of deterministic SRS scoring.
- Provider secrets never live in browser JavaScript or GitHub Pages. AI calls go through authenticated server-side functions and generated content is cached.
- The standalone Flashcards app remains available until the merged experience is validated and migration is reversible.

## Shared foundation

`src/engine/flashcards.js` provides the shared vocabulary/SRS domain layer while preserving existing card scheduling fields.

`src/engine/integrations.js` provides explicit adapter boundaries for persistence and server-side generation.

Regression tests cover core migration behaviours including SRS preservation, strict new-card limits, daily completion and retention rules.

## Live integrated Flashcards path

Dutch Learning now contains a working Flashcards destination using the existing `cards` and `reviewhistory` data. It includes:

- the full daily SRS batch;
- Again / Hard / Good / Easy writes;
- requeue behaviour;
- review-load dampening of new cards without exceeding the configured ceiling;
- persisted done-for-today behaviour;
- live progress/retention information;
- trouble-word visibility;
- shared card editing and sentence support.

During this migration stage the app continues to reuse the public browser configuration already deployed by the standalone Flashcards PWA. Before legacy retirement, Dutch Learning should own this configuration directly.

## English-to-Dutch production bridge

Mature cards progress conservatively through recognition, supported production, guided production, independent production and contextual production. Production practice remains separate from Flashcard SRS scheduling and writes learning evidence rather than changing intervals or due dates.

Supported words use multiple choice. Guided phrases can use word construction. Guided single words use partial-spelling recall rather than one-tile giveaways. Repeated independent failure can reduce support level/exposure rather than forcing the same spelling task indefinitely.

## Contextual sentence banks

The deterministic sentence-bank layer rotates cached examples and keeps generation behind authenticated server-side services. Generated examples are reused rather than making an API call every time a card appears.

## Sentence maintenance

V5.1.92 includes a dedicated sentence-maintenance workflow:

1. Flag a word during Flashcard review.
2. Persist the flag in Supabase using `cards.sentence_flagged`.
3. Open Sentence maintenance from the Flashcards dashboard.
4. Prepare five AI Dutch/English sentence alternatives for every flagged word before the selection screen appears.
5. Select one alternative, request five fresh alternatives, edit manually, or remove the flag.
6. Saving a replacement updates the card sentence but does not change SRS scheduling/history.

Local browser queue data is retained only as migration/compatibility state; shared Supabase flag state is the cross-device source to converge on.

## Stabilisation boundary

Do not continue broadening this branch with unrelated main-learning features. Remaining work on the Flashcards epic should be defect fixes and verification only.

After the V5.1.92 verification checklist passes, begin the main learning-side development as a fresh bounded milestone centred on one complete learner-visible session loop rather than isolated widgets.
