# Dutch Sentence Trainer · V5.1.92

Static, offline-first Dutch practice app hosted with GitHub Pages. Serve this directory with any static HTTP server; no build step or runtime package installation is needed.

## Current checkpoint

V5.1.92 is the stabilisation checkpoint for the integrated Flashcards work inside Dutch Learning. The unified app now contains the live Flashcard batch, Supabase-backed scheduling/history writes, strict daily new-card ceiling and completion lock, progress reporting, English → Dutch production support, contextual sentence-bank infrastructure, and the sentence-maintenance workflow with five AI alternatives per flagged word.

The standalone Flashcards app remains the fallback until the integrated path passes the remaining real-device and persistence checks.

See `docs/checkpoint-v5.1.92.md` for the current verification checklist and the boundary for the next development milestone.

## Tests

With Node.js 22 or later, run `npm test` (or `node --test`). GitHub Actions runs the same dependency-free regression suite for pushes and pull requests.

## Development direction after V5.1.92

Do not keep extending the current Flashcards integration branch with unrelated learning features. Once the checkpoint is verified, the next bounded milestone is one complete learner-visible A1 session loop:

`start → teach/review → recognise → construct → produce → feedback/support → finish → persist`

The first slice should use a small amount of real A1 content and be tested as a complete daily experience before expanding curriculum breadth or adding more exercise types.

## Product invariants retained

- The configured maximum-new-cards value is a hard ceiling; current required value is 5/day.
- Review load may reduce new-card introduction but never increase it above the configured ceiling.
- Completing the normal daily session closes that session for the study day; unused capacity is not replenished later.
- Existing Supabase card identity, SRS scheduling state and review history remain authoritative.
- Sentence/production support may enrich learning evidence but must not silently alter SRS history.
- Repeated difficulty should trigger support or reduced exposure rather than endless forced repetition.
- The standalone Flashcards app is not retired until the integrated path is explicitly validated.
