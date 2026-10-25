# Development question gallery — 25 October 2026

Local candidate prepared from production/source `26272d5` (V5.1.195). Open the local development app, then Settings → Question type examples → Open question examples. Production has no gallery entry.

## Scope and contract

The gallery is an Experimental diagnostic tool for inspecting the existing nine daily question kinds, not a new study format. It uses synthetic `Ik drink koffie.` content, existing generation/scoring/feedback helpers, and one selected example at a time. The missing-letters example is labelled with its actual task. Choices, tile construction, typed answers, hold-for-help, feedback and retry are temporary. Switching type resets the selected example; refresh loses all gallery answers. No gallery answers enter evidence, proofs, scheduling, Flashcards or the daily 20. Repeated failure can be followed by the full model and another optional example attempt; no compulsory loop exists.

Speaking uses a clearly labelled sample-transcript simulation and offers the typed fallback. It neither records nor transcribes speech and earns no speaking evidence. It is not a validation of the accepted production microphone path. Listening reuses existing audio and offers an immediate visible-text fallback; it does not establish unseen listening ability because all examples share a sentence. No new provider or paid service is introduced. No paid call was made during review.

## Files

- `src/engine/question-type-gallery.js`: synthetic examples and task names.
- `src/ui/question-type-gallery.js`: development Settings entry and temporary interactive screen.
- `src/ui/question-type-gallery.css`: scoped layout with reachable actions.
- `tests/question-type-gallery.test.js`: kind coverage, model scoring, integration, isolation and simulation guards.
- `index.html`, `sw.js`: module/style loading and offline asset inventory.
- `DEVELOPMENT.md`: local candidate and source baseline notes.

The PR uses a clean V5.1.195 checkout. Original Flashcard and documentation edits are preserved in the original workspace and excluded from this PR. No production version/cache identifier bump is included.

## Verification

- Five focused gallery tests pass.
- Final full suite: 619/619 passing after the presentation refinements.
- Browser: development Settings entry opens the gallery; correct English choice shows model/meaning; wrong typed verb shows corrective Dutch and explanation; retry clears the answer; switching types resets it; sample speaking transcript can be checked; listening text fallback remains answerable.
- Phone-sized 390×844 browser: corrected introductory length and sticky-action placement; written input, hold-for-word, Check Answer and bottom navigation visible together. Speaking simulation also inspected at this size. This is browser emulation, not real-iPhone acceptance.
- Whitespace/diff review performed in the task.

Owner acceptance: on 25 October 2026 the owner confirmed these checks passed on Mac and mobile, including the requested layout, keyboard/hold, listening/fallback and offline checks. This is owner-reported device validation. Actual microphone/transcription is deliberately outside this simulation. No live learner-data changes or cross-device claims.

## Safety and rollback

Daily contract, mastery/retention, learner data, database schema, authentication, providers, protected functions, cost limits and production deployment are unchanged. Production study and standalone Flashcards remain available. Remove the gallery entry script/style and offline assets, or revert only gallery files to roll back. The owner approved merge and deployment on 25 October 2026 after acceptance. Merge/deployment evidence is recorded in the release handoff. Linear DAB-88 was consulted for the quality-review context; no issue was reopened or status changed.
