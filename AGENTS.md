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

The owner is the sole product owner and user. Only the owner can approve a change to product direction, learning policy, production architecture, or data model. A broad request such as "review and improve", "clean up", or "modernise" is not permission to redesign unrelated areas or expand scope.

## Required working protocol

For every agent/Cursor task:

1. Inspect this file, `DESIGN.md`, `DEVELOPMENT.md`, the relevant implementation and tests, and the current Git status before proposing or editing.
2. Confirm the source baseline and create a recoverable checkpoint or focused branch before substantial work. `main`/GitHub is the production source of truth; do not build on an unexplained dirty tree or unverified generated/deployed artifact.
3. State the intended outcome and exact files expected to change. If discovery materially expands that list or the requested scope, stop and obtain owner approval.
4. Make the smallest coherent, bounded change. Preserve all behaviour outside the explicit scope and do not bundle opportunistic refactors, dependency upgrades, redesigns, or backlog items.
5. Add or update focused regression tests for behavioural changes where practical, then run the relevant focused tests and `npm test` before calling implementation work complete.
6. Report the files changed, tests run and results, behaviour/data/deployment impact, remaining risks, and manual verification still needed. Show a concise diff-level scope for owner review.
7. Do not merge, push, deploy, alter production data, or delete a recovery path merely because tests pass. Those actions require explicit scope or owner approval.

When asked only to establish guardrails or documentation, do not change application behaviour to make the documentation true. Record any discovered mismatch as a risk or follow-up for owner review.

## Non-negotiable product constraints

- The configured maximum-new-cards value is a hard upper limit. The current required value is 5 per day.
- Workload logic may reduce new-card introduction but must never silently increase it beyond the configured limit.
- Completing the generated normal daily session must end normal learning for that study day. Unused new-card capacity must not be replenished later that day.
- Optional Review Ahead behaviour, and optional open “keep talking” conversation, must remain distinct from the normal completed daily session.
- When conversation practice exists, a short finite listening beat and speaking beat belong in the generated normal daily session. They must not become unbounded chat, refill unused new-card capacity, or replace mastery/retention proofs.
- Flashcards remain a defined, satisfying batch-based learning activity with meaningful retention reporting.
- English-to-Dutch production should be introduced progressively and supportively.
- Repeated failure should lead to useful scaffolding or reduced immediate repetition, not an indefinite loop on the same spelling/item.
- Answer-reveal assistance should promote recall; hold-to-show is preferred where revealing a word could otherwise encourage copying.
- Feedback should show sufficient phrase/sentence context to make the relevant language pattern clear.
- Speaking and listening are high-priority learning capabilities; preserve working speech and audio paths when changing exercises or interface structure.
- Listening audio and speech transcription use the existing server-side OpenAI key only. Never put a provider API key in the browser or PWA. Do not implement OpenAI Realtime as the first conversation path.
- Speaking questions must remain skippable: convert the pending spoken item to the same typed question. Do not drop the item, add extra work, or refill unused daily capacity. Existing learner history defaults speaking off.
- The practice experience is one-screen, mobile-first, and iOS-like. Keep the primary Check Answer action pinned/easy to reach and avoid unnecessary scrolling during normal questions.
- Mobile/PWA usability is a first-class requirement.
- Do not add points, streak pressure, leagues, badges, rewards, or other gamification unless the owner explicitly changes the product direction.
- The app is for one owner; do not add multi-user/commercial/product-growth complexity without explicit approval.

## Change-control boundaries

Do not replace or materially rework the following without explicit owner approval:

- the AI provider or model strategy;
- the application architecture or deployment/hosting platform;
- Supabase as the database, persistence, or authentication platform;
- the authentication flow or its trust boundaries;
- the scheduling, daily-completion, flashcard, retention, or reporting model.

Do not treat a new framework, provider, abstraction, or rewrite as an incidental implementation detail. If an approved task genuinely requires one of these changes, first document the reason, affected behaviour/data, migration and rollback plan, and validation required.

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

- Do not alter existing Supabase tables, schema, migrations, policies, functions, or production data unless that exact change is explicitly approved.
- Never commit secrets, passwords, API keys, service-role keys, or private credentials.
- Preserve backwards compatibility where practical.
- For potentially destructive data changes, establish and document recovery/rollback before execution.
- Real-device/cross-device behaviour must be tested when the change depends on Supabase synchronisation or PWA persistence.

Production sentence generation currently uses OpenAI through the restored deployed `generate-sentences` Supabase Edge Function. It uses `OPENAI_API_KEY`, the OpenAI Responses API and owner/Google authentication plus daily quota controls; its `verify_jwt = false` setting is deliberate because authentication is enforced inside the function. Do not replace this path, change provider, weaken its checks, or infer the deployed function from unrelated local code without explicit owner approval and production-safe validation.

## Coding and testing

- Prefer the smallest coherent change that satisfies the issue.
- Preserve existing UI and behaviour unless the task requires changing them.
- Treat existing passing behaviour as a compatibility surface, not an invitation to rewrite it.
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
