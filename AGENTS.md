# Dutch Learning — Agent Instructions

These instructions apply to AI-assisted development in this repository, whether work is performed through ChatGPT, Work, Codex, or another coding agent.

## Read first

Before substantial work:

1. Read `DESIGN.md` for product and learning intent.
2. Read `DEVELOPMENT.md` for current implementation state, milestones, and development discipline.
3. Read the relevant GitHub issue and existing tests/code before proposing changes.

Do not infer a new product direction merely from current implementation behaviour.

## Primary rule

This is personal learning software with real learner history. Protect the learner's ability to study and protect existing progress before optimising architecture or adding features.

## Non-negotiable product constraints

- The configured maximum-new-cards value is a hard upper limit. The current required value is 5 per day.
- Workload logic may reduce new-card introduction but must never silently increase it beyond the configured limit.
- Completing the generated normal daily session must end normal learning for that study day. Unused new-card capacity must not be replenished later that day.
- Optional Review Ahead behaviour must remain distinct from the normal completed daily session.
- Flashcards remain a defined, satisfying batch-based learning activity with meaningful retention reporting.
- English-to-Dutch production should be introduced progressively and supportively.
- Repeated failure should lead to useful scaffolding or reduced immediate repetition, not an indefinite loop on the same spelling/item.
- Answer-reveal assistance should promote recall; hold-to-show is preferred where revealing a word could otherwise encourage copying.
- Feedback should show sufficient phrase/sentence context to make the relevant language pattern clear.
- Mobile/PWA usability is a first-class requirement.
- The app is for one owner; do not add multi-user/commercial/product-growth complexity without explicit approval.

## Flashcards migration safety

The standalone Flashcards application is intended to be replaced by Dutch Learning, but it is currently a production safety path.

At least one reliable platform must remain available for completing normal sessions throughout development.

Therefore:

- do not retire, disable, or destructively modify the standalone Flashcards production path until the integrated Dutch Learning replacement has been validated and explicitly accepted;
- prefer reversible migration stages;
- protect card identities, scheduling state, review history, and learner progress;
- document migration/rollback assumptions;
- treat passing automated tests as necessary but not sufficient for production migration.

## Supabase and data

- Do not make casual schema changes.
- Never commit secrets, passwords, API keys, service-role keys, or private credentials.
- Preserve backwards compatibility where practical.
- For potentially destructive data changes, establish and document recovery/rollback before execution.
- Real-device/cross-device behaviour must be tested when the change depends on Supabase synchronisation or PWA persistence.

## Coding and testing

- Prefer the smallest coherent change that satisfies the issue.
- Preserve existing UI and behaviour unless the task requires changing them.
- Add/update regression tests for behavioural changes where practical.
- Run the repository test suite (`npm test`) before declaring code complete.
- Do not suppress failing tests merely to make CI green.
- When a test expectation conflicts with `DESIGN.md`, investigate the intended behaviour rather than automatically preserving the test.

## GitHub workflow

- Associate substantial changes with a GitHub issue.
- Use focused feature branches/PRs for substantial implementation work.
- Prefer one coherent purpose per PR.
- Avoid allowing long-running branches to accumulate unrelated changes.
- Keep PR descriptions clear about behaviour changed, tests performed, migration impact, and manual verification still required.
- Do not merge draft/integration work solely because it is mergeable.

## Documentation responsibility

Update `DEVELOPMENT.md` when work materially changes:

- current production state;
- active milestone/phase;
- architecture;
- migration state;
- known risks;
- immediate next steps.

Update `DESIGN.md` only when the intended product behaviour itself has changed and that change has been explicitly agreed with the owner.

GitHub issues should capture actionable work; do not use documentation as a substitute for issue tracking or create speculative issue clutter.

## Completion standard

Before reporting a substantial task as complete, state:

- what changed;
- what tests were run and their result;
- what manual/real-device verification remains;
- whether learner data or migration state was affected;
- whether documentation/issues need updating.

Never claim a GitHub update, test, deployment, or device verification occurred unless it actually did.
