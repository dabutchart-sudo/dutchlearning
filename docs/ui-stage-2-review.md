# UI Stage 2 review — V5.1.154 local candidate

Stage 2 starts from the owner-accepted Stage 1 commit `d0e452e` on its own `feature/zin-ui-stage-2` branch. Production remains V5.1.151.

The owner approved proceeding to Stage 3 after the Learning navigation correction. This was approval of the local UI direction, not a production release.

## What changed

- Course opens on the current topic and a single primary study action. A ready mastery or retention test is named only when the existing proof offer says it can start today. A completed Learning day has no start action.
- The timeline keeps the full syllabus but uses shorter, uniform rows. Locked topics show the retained prerequisite required to open them. Tapping a topic still opens its detail page; retained extra practice is there.
- Topic details put the next step and action before the lesson. Practice counts and general proof guidance are in an expandable section. Ready proof actions remain visible.
- Detailed latest-proof results are collapsed below the current-topic card. Course no longer jumps past the top action when it renders.
- Version and offline cache are advanced to V5.1.154 for this candidate.
- Learning now keeps the four-icon bottom navigation visible. The question layout reserves room above it, and moving from Learning to Flashcards restores the normal screen layout while retaining saved Learning progress.

## Checks and boundaries

- Focused Course and progress tests pass. The complete suite passes: 427 tests, 0 failures (`npm test`).
- Phone-size Course and topic screenshots are in `../../ui-proposal/stage2-course.png` and `../../ui-proposal/stage2-topic.png`. They use illustrative progress and are not live learner data.
- A 320-pixel Course preview keeps the current action, timeline rows, and bottom navigation inside the screen.
- The local phone preview uses V5.1.154. The Learning navigation correction still needs a real phone check; installed PWA and cross-device checks also remain before release.
- Unlocks, 20-question Learning completion, mastery and retention eligibility, Flashcard scheduling, persistence, Supabase, authentication, services, and learner data are unchanged. No new running cost or production deployment.
- The accepted Stage 1 commit and V5.1.151 production source are rollback points. Stage 2 has not been merged or deployed.
