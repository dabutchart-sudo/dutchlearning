# Dutch Learning — Development

## Current production state

- Release prepared and owner-authorized: Zin V5.1.119 (Course progress and syllabus).
- Delivery: GitHub Pages / installable PWA.
- Persistent signed-in progress: Supabase.
- Known-good source baseline: commit `9460576d79828a0509f297322b2f9100f0ff259f` (`Merge unified Zin V5.1.118 into main`).
- Automated engine tests run through GitHub Actions with `npm test`.
- Real-device verification of V5.1.5 remains an outstanding tracked task.
- The standalone Flashcards application remains the reliable production flashcard path while unified flashcard development is validated.

The restored production `generate-sentences` Supabase Edge Function uses OpenAI (`OPENAI_API_KEY` and the Responses API) with owner/Google authentication and daily quota controls. The deployed function is a production boundary even though its source is not currently present in this repository. Do not recreate, replace, or redeploy it from assumptions or from `generate-visual`; inspect the deployed source and obtain explicit owner approval before any change. Its current `verify_jwt = false` configuration is deliberate because the function performs authentication internally.

See `DESIGN.md` for product and learning requirements. This document describes implementation state, development priorities, and delivery discipline.

## Architecture overview

Dutch Learning is currently a lightweight web/PWA application with application logic, question generation, scheduling/learning state, tests, service-worker/PWA support, and Supabase-backed persistence for signed-in use.

Development should preserve the deliberately small deployment footprint unless a larger architecture provides a clear learning or reliability benefit.

Changing the AI provider, model strategy, application architecture, GitHub Pages hosting, Supabase database/persistence, or authentication design is an architectural decision requiring explicit owner approval. It is never an incidental cleanup or dependency choice.

## Agent/Cursor change protocol

Before editing:

1. Read `AGENTS.md`, `DESIGN.md`, this document, the relevant code/tests, and `git status`.
2. Confirm that the intended starting point is a known source/GitHub baseline. Create a focused branch or named checkpoint before substantial work; preserve unrelated owner changes if the tree is already dirty.
3. State the bounded objective and intended file list. A broad "review and improve" request authorises analysis and proposals, not unrelated implementation.

While editing, keep one coherent scope, preserve behaviour outside it, and avoid opportunistic refactors, dependency/provider swaps, schema work, deployments, or UI redesign. If new information requires a materially broader change, stop and ask the owner rather than silently expanding the task.

Before handoff:

1. Review the exact diff and confirm it contains only the agreed scope.
2. Run focused tests plus `npm test` for implementation changes; documentation-only changes still require diff/whitespace validation and confirmation that no runtime files changed.
3. Report changed files, tests and results, application/data/deployment impact, risks, and remaining manual checks.
4. Leave the branch/checkpoint available for owner review. Do not merge, push, deploy, mutate Supabase, or remove recovery paths unless explicitly requested.

## Current active milestone

### Milestone: Unified Flashcards

Goal: replace the standalone Flashcards application with a fully integrated Dutch Learning flashcard experience without interrupting the learner's ability to complete daily sessions.

Current Phase 1 work is tracked in draft PR #13 (`feature/unified-flashcards-phase-1`). It introduces a reversible shared foundation. The standalone Flashcards app remains the production path while this work is validated.

The operational board for this epic is **Dutch Learning - Unified Flashcards · Project #6**:
https://github.com/users/dabutchart-sudo/projects/6

Its standard workflow is **Todo → In Progress → Testing → Done**.

Suggested staged roadmap:

1. **Shared foundation** — domain helpers, integration boundaries, migration notes, regression coverage.
2. **Data integration** — establish safe compatibility/migration of card and review state.
3. **UI integration** — bring the defined flashcard session experience into Dutch Learning.
4. **Learner-state integration** — ensure scheduling, daily completion, reporting, and cross-device state behave correctly together.
5. **Production migration** — validate the integrated path on real devices and make Dutch Learning the normal flashcard platform.
6. **Legacy retirement** — archive the standalone Flashcards app only after the integrated platform is proven reliable.

At every stage, at least one reliable platform must remain available for completing the learner's normal sessions.

## Other active work

### Daily session completion
Issue #12 tracks the requirement that completion of the generated normal daily queue ends normal learning until the next study day. Unused new-card capacity must not be offered later that day.

### Real-device verification
Issue #8 tracks iPhone/PWA/Supabase verification for V5.1.5. Browser-only testing is not sufficient evidence for cross-device persistence or installed-PWA cache behaviour.

## Development priorities

Unless a defect requires urgent attention, prefer work in this order:

1. Protect the learner's ability to complete daily study.
2. Protect existing learner data and review history.
3. Fix correctness/reliability problems.
4. Improve learning effectiveness and workload sustainability.
5. Improve clarity/mobile usability.
6. Add new learning capabilities.
7. Add cosmetic or convenience features.

## Development cadence

This project is a hobby project and should favour focused, rewarding increments over maximising the quantity of AI-generated work.

Prefer one coherent, testable improvement at a time. Avoid asking an agent to consume a large backlog simply because capacity is available. Larger initiatives should be split into stages that provide visible or meaningful progress while remaining reviewable.

## Branches and pull requests

- `main` represents the production baseline/documented source of truth.
- Substantial development should use focused feature branches and pull requests.
- Prefer one coherent purpose per PR.
- Large migrations should be split into staged PRs with explicit compatibility boundaries.
- Draft PRs are appropriate for integration work that is not yet intended to become production.
- Do not merge migration work merely because automated tests pass; relevant real-device/user validation may still be required.

PR #13 predates this formalised workflow and is unusually large. Treat it as an existing migration snapshot, not as the preferred size for future PRs.

## Issues and project structure

Issue #7 is the portfolio anchor for Dutch Learning.

Every active epic should have a dedicated GitHub Projects board as its operational work view. The standard status flow is **Todo → In Progress → Testing → Done**. The higher-level personal Project Portfolio remains the cross-project overview rather than replacing epic-level boards.

The Unified Flashcards board is bootstrapped by `.github/workflows/bootstrap-unified-flashcards-project.yml`, using the repository Actions secret `PROJECTS_TOKEN`. The secret must never be printed or committed.

Substantial work should normally have an issue describing the problem/objective and acceptance criteria. Group related work conceptually under these areas as the backlog develops:

- Unified Flashcards
- Daily learning and scheduling
- Sentence and grammar learning
- Progress and reporting
- Cross-device reliability
- UX and mobile polish

Do not create issues merely to make the backlog look comprehensive. Capture real intended work when it becomes actionable.

## Testing

For behavioural changes:

- Add or update automated regression tests where practical.
- Run `npm test` before considering the implementation complete.
- Test scheduling/date-boundary changes carefully.
- Protect compatibility with existing learner state.
- Use real-device testing for PWA installation/cache behaviour, mobile layout, and cross-device Supabase behaviour when relevant.
- For migration work, validate that the old reliable study path remains available until the replacement is accepted.
- Keep regression coverage for the hard adjustable new-card ceiling (currently 5), no extra normal cards after daily completion, the batch flashcard workflow, retention/reporting, gradual English-to-Dutch production, hold-to-show help, and mobile practice layout.

## Data and migration safety

Changes involving Supabase schema, review history, scheduling fields, learner progress, or card identity are high-impact.

Do not alter existing Supabase tables, schema, migrations, policies, production functions, authentication configuration, or data unless the owner explicitly approves that exact scope. Prefer an application-side compatible change when possible, but do not introduce a compatibility layer that silently changes behaviour or weakens access control.

Before destructive or irreversible migration:

1. document the intended transformation;
2. preserve or establish a rollback/recovery path;
3. test against representative data;
4. verify the new path before retiring the old one.

Never commit API secrets, service-role keys, passwords, or private credentials.

## Release discipline

A change is done when the relevant combination of the following is true:

- acceptance criteria are satisfied;
- automated tests pass;
- required manual/real-device checks pass;
- existing learner data is preserved;
- production study remains available;
- version/release documentation is updated where appropriate;
- `DEVELOPMENT.md` is updated when project state or milestones materially change;
- the associated issue/PR accurately records outcome and remaining follow-up.

## Immediate next steps

1. Continue validating Phase 1 without retiring the standalone Flashcards production path.
2. Complete issue #8 real-device/Supabase checks when appropriate.
3. Resolve issue #12 so daily-session completion matches `DESIGN.md`.
4. Split subsequent Flashcards integration phases into focused, testable increments and place their work on the epic board.

## Course & Progress review preview — 2026-09-18

A separate local branch, `feature/course-progress-preview`, starts from main `5cf5422` (V5.1.118 source). The owner requested a working preview of a syllabus map and learning-progress dashboard, plus the previously recorded missing-form/full-sentence fix. This follows the progression-clarity work in #17 and the course-understandability criterion in #31.

The implementation reads the existing Learning history and progression rules. It does not change scheduling, daily limits, Flashcards, learner-history records, database schema or migration state. Planned A1 content remains unavailable, and no fluency/CEFR certification claim is made.

See `docs/course-progress-preview.md` for the precise file scope, local preview, evidence definitions and remaining manual checks. The isolated preview uses labelled sample history and has no live account connections. Production remains unchanged; owner review comes before publication. Final automated validation: 278 tests passed, zero failures; `git diff --check` passed. Desktop and phone-size browser checks passed for the reviewed scenarios.


## V5.1.119 release — 2026-09-18

The owner accepted the working Course preview, particularly the Syllabus tab, and explicitly authorized proceeding with release. The release adds progress charts and a browsable syllabus/current position, and fixes complete-sentence answers to missing-form exercises. Related issues: #31 and #17; their broader readiness requirements remain open.

Validation: 279 tests passed using the package test command (`node --test`). The new worker regression executes installation, verifies every cached asset exists, simulates offline requests for the Course modules/style and versioned entry point, and confirms activation deletes only old caches within this app's scope. Desktop and phone-size preview checks passed in the preceding review. Physical iPhone installed-PWA update/offline behaviour still needs an owner device check; this is not claimed as verified.

No learner records, persistence schema, authentication, scheduling or migration state change. Release/cache identifiers advance to 5.1.119. Rollback is a revert of this focused PR followed by a fresh cache identifier; retain the branch and prior main commit `5cf5422` as source recovery points. Publication status is recorded in the PR and task completion report.
