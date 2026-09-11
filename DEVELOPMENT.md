# Dutch Learning — Development

## Current production state

- Active Dutch Learning release: V5.1.5.
- Delivery: GitHub Pages / installable PWA.
- Persistent signed-in progress: Supabase.
- Automated engine tests run through GitHub Actions with `npm test`.
- Real-device verification of V5.1.5 remains an outstanding tracked task.
- The standalone Flashcards application remains the reliable production flashcard path while unified flashcard development is validated.

See `DESIGN.md` for product and learning requirements. This document describes implementation state, development priorities, and delivery discipline.

## Architecture overview

Dutch Learning is currently a lightweight web/PWA application with application logic, question generation, scheduling/learning state, tests, service-worker/PWA support, and Supabase-backed persistence for signed-in use.

Development should preserve the deliberately small deployment footprint unless a larger architecture provides a clear learning or reliability benefit.

## Current active milestone

### Milestone: Unified Flashcards

Goal: replace the standalone Flashcards application with a fully integrated Dutch Learning flashcard experience without interrupting the learner's ability to complete daily sessions.

Current Phase 1 work is tracked in draft PR #13 (`feature/unified-flashcards-phase-1`). It introduces a reversible shared foundation. The standalone Flashcards app remains the production path while this work is validated.

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

## Data and migration safety

Changes involving Supabase schema, review history, scheduling fields, learner progress, or card identity are high-impact.

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

1. Establish the Unified Flashcards work as a formal epic/roadmap item.
2. Continue validating Phase 1 without retiring the standalone Flashcards production path.
3. Complete issue #8 real-device/Supabase checks when appropriate.
4. Resolve issue #12 so daily-session completion matches `DESIGN.md`.
5. Split subsequent Flashcards integration phases into focused, testable increments.
