# UI Stage 3 review — V5.1.155 local candidate

Stage 3 started from the Stage 2 local checkpoint `a6c0367` on `feature/zin-ui-stage-3`. At review time, production remained V5.1.151 and Stage 2 was unmerged.

Release outcome: the owner approved and iPhone-checked this layout. Stages 1–3 were merged in [PR #121](https://github.com/dabutchart-sudo/dutchlearning/pull/121) and GitHub Pages now serves V5.1.155. The notes below record the pre-release review state.

## What changed

- Learning questions show a compact finite count, a topic label, a small progress track, and an icon Pause action in a consistent position. Mastery and retention counts use their own test lengths; their rules remain available under “Test rules”. Extra practice remains clearly separate from today's 20.
- Word help no longer repeats the hold instruction. Its accessible name explains that using help removes independent Dutch writing credit.
- Answer feedback keeps the complete Dutch sentence, English meaning, differences, and teaching explanation visible. Grammar, spelling, capitalisation, and assistance details sit under “How this answer counts”.
- The Check answer / Continue action remains pinned within the question card, above the bottom navigation.
- The version and offline cache advance to V5.1.155. The new small UI helper is precached for installed use.

## Review and boundaries

- Illustrative 390 × 844 phone mockups: `../../ui-proposal/stage3-question.png` and `../../ui-proposal/stage3-feedback.png`. They show invented example progress, not learner data or a captured device session.
- Focused Learning, help, proof, and mobile tests pass. The complete automated suite passes: 430 tests, 0 failures (`npm test`).
- Real iPhone, installed PWA, keyboard, and screen reader checks remain outstanding. The illustration does not prove device layout.
- Scoring, the daily 20, proof gates, Flashcard scheduling, persistence, sync, Supabase, authentication, services, and learner data are unchanged. No production deployment or new running cost.
- Rollback is Stage 2 checkpoint `a6c0367`; production remains V5.1.151 with the standalone Flashcards fallback.
