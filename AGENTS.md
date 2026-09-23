# Dutch Learning — Agent Instructions

These instructions apply to AI-assisted work in this repository through ChatGPT, Work, Codex, Cursor, or another coding agent.

## Read first

Before substantial work, read:

1. `DESIGN.md` — product and learning authority;
2. `DEVELOPMENT.md` — current production state, active roadmap, and delivery discipline;
3. the relevant Linear/GitHub issue;
4. the implementation and tests in scope;
5. current Git status and branch baseline.

Do not infer product direction from current implementation behaviour or stale historical issues.

## Primary rule

This is live personal learning software with genuine learner history. Protect the learner's ability to study and protect existing progress before optimising architecture or adding capability.

The owner is the sole product owner and learner. Only the owner can approve changes to product direction, learning policy, provider/model strategy, production architecture, hosting, authentication, scheduler, data model, or production study contract.

A request to review, improve, modernise, or clean up is not permission for unrelated redesign, refactoring, dependency changes, schema work, or backlog expansion.

## Agreed direction

Owner decision 2026-09-23: Zin will evolve incrementally into the learner's primary method for conversational Dutch.

This is not permission for a rewrite or immediate open-ended chatbot. Work follows the staged roadmap in `DEVELOPMENT.md`:

1. baseline, feature flags, question catalogue, and evidence model;
2. question quality and teaching audit;
3. trustworthy progress;
4. deeper listening;
5. conversational chunks and scenarios;
6. assessed speaking;
7. controlled dialogue;
8. broader conversation.

Coordinate three tracks: conversational capability, question-format quality, and evidence-based progress visualisation.

## Required working protocol

For each task:

1. Confirm the current production/source baseline and create a focused, recoverable branch or checkpoint.
2. State the intended outcome, exact files expected to change, and application/data/deployment/cost impact.
3. Make the smallest coherent change. Preserve all behaviour outside the approved scope.
4. Add or update focused regression tests for behaviour changes.
5. Run focused tests and `npm test` before calling implementation complete.
6. Perform relevant phone/PWA/device checks where audio, speech, layout, cache, or synchronisation is affected.
7. Review the exact diff and report files, tests, behaviour, learner-data impact, deployment status, costs, risks, rollback, and remaining manual checks.
8. Do not merge, deploy, alter production data, or remove recovery paths merely because tests pass. Those actions require explicit scope or owner approval.

If discovery materially expands scope, stop and obtain owner approval.

Documentation-only work must not change runtime behaviour or claim that planned behaviour is implemented.

## Non-negotiable study contract

- Course remains home.
- The normal Learning session is finite: 20 questions per study day.
- A ready mastery/retention proof must be offered before ordinary practice when the remaining daily allowance permits it.
- Mastery is a finite 20-question unseen written proof; retention is a later 10-question written proof unless explicitly redesigned.
- Completing the normal daily session ends normal Learning for that study day.
- Optional Free Practice, Review Ahead, Experimental/Practice activities, and future open conversation remain distinct from normal daily completion.
- The configured maximum-new-card value is a hard ceiling; the current required maximum is 5 per day.
- Workload logic may reduce new cards but never silently increase or replenish them after completion.
- Flashcards remain a separate, satisfying batch with meaningful retention reporting.
- English-to-Dutch production increases gradually and supportively.
- Repeated failure produces scaffolding, a simpler step, or reduced exposure—not an indefinite loop.
- Spelling evidence must not unfairly block grammar/concept progress.
- Hold-to-show is preferred where immediate reveal encourages copying.
- Feedback includes enough sentence context to teach the relevant pattern.
- Capitalisation is not penalised where meaning and Dutch orthography do not require it.
- Multiple-choice English answers are preferred to typing English.

## Question-format controls

Every new or materially changed format must define:

- capability being taught or assessed;
- teaching, guided, independent, or proof role;
- acceptable-answer and ambiguity rules;
- help and its evidence consequences;
- success, near-miss, and failure feedback;
- repeated-failure behaviour;
- offline/service-failure fallback;
- mobile layout;
- persistence/resume behaviour;
- automated and manual validation.

New formats progress through **Experimental → Practice → Trial → Core**:

- Experimental: isolated route; no production progress.
- Practice: optional; diagnostic evidence only.
- Trial: small controlled daily share; limited evidence.
- Core: normal adaptive session; full relevant evidence.

Do not skip levels or promote a format solely because it works in a developer preview. Keep a feature flag or equivalent rollback until the path is proven.

Optional-service failure must convert or substitute an item safely; it must not strand the daily session.

## Evidence and progress rules

Progress has three separate meanings:

1. Course journey — syllabus location and next objective.
2. Capability profile — what the learner can demonstrate.
3. Retention/activity — whether learning is sticking and study is occurring.

Evidence must be capability-specific:

- visible-text playback is exposure, not listening proof;
- a typed fallback is production evidence, not speaking evidence;
- an isolated sentence is not interaction evidence;
- revealed/support-heavy success is not independent proof.

Do not invent a single overall score that implies balanced conversational ability. Do not add points, streak pressure, leagues, badges, rewards, chests, or other gamification.

## Listening, speaking, and conversation

- Listening and speaking are high-priority capabilities.
- The current normal daily session may contain one finite listening beat and one optional speaking beat.
- Speaking remains skippable; skipping converts the same item to typing without adding work.
- Keep mastery and retention proofs written until explicitly changed.
- Start with controlled, request/response paths; do not implement OpenAI Realtime first.
- Controlled dialogue precedes open conversation.
- Open “keep talking” conversation remains optional extra study unless explicitly approved otherwise.
- Preserve working audio and speech paths when changing exercise or interface structure.

## UI requirements

- Mobile-first, PWA-friendly, usable on iPhone and MacBook, and iOS-like in clarity.
- Normal questions use a stable single-screen shell.
- Keep **Check Answer** pinned or continuously easy to reach.
- Avoid unnecessary scrolling and visible internal scoring/state during questions.
- Course, Flashcards, Progress, and Settings remain the main destinations.
- GitHub Pages is the genuine study origin; local/`192.168` copies remain visibly marked Development.
- Interface character comes from colour, path design, and human copy—not game chrome.

## Architecture, AI, and cost boundaries

Do not replace or materially rework without explicit owner approval:

- OpenAI/provider/model strategy;
- application architecture or GitHub Pages hosting;
- Supabase database, persistence, authentication, policies, or functions;
- scheduling, daily completion, Flashcards, retention, or reporting models.

Audio and transcription use the existing server-side OpenAI key through authenticated, quota-controlled functions or local preview environment. Never expose provider keys to browser/PWA code, logs, tests, or commits.

New AI services require explicit daily/monthly spend limits and must fit the owner's modest running-cost target. AI output must not silently award permanent mastery without explainable evidence and deterministic safeguards.

## Supabase and learner data

- Do not alter tables, schema, migrations, policies, functions, authentication configuration, or production data unless that exact change is approved.
- Preserve card identities, scheduling state, review history, learner history, and empty-local/populated-remote recovery behaviour.
- Prefer additive and backwards-compatible changes.
- Establish and document rollback before high-impact changes.
- Test cross-device behaviour when persistence or synchronisation changes.
- Never commit secrets, passwords, API keys, or service-role credentials.

Production `generate-sentences` and `listen-tts` functions are protected boundaries. Inspect deployed/current source before approved changes; do not reconstruct or redeploy them from assumptions.

## Reliable-study fallback

At least one reliable platform must remain available for genuine sessions throughout development.

The integrated Zin Flashcards path is accepted production. The standalone Flashcards app remains a fallback until an explicit retirement task is approved and validated. Do not disable, destructively modify, or discard that recovery path incidentally.

## Coding, tests, and releases

- Prefer one coherent purpose per branch/PR.
- Avoid opportunistic refactors and dependency upgrades.
- Treat passing current behaviour as a compatibility surface.
- Do not suppress tests merely to make CI green.
- Investigate conflicts between tests and `DESIGN.md`; do not automatically rewrite the design around an implementation shortcut.
- Protect regression coverage listed in `DEVELOPMENT.md`.
- Passing tests are necessary but not sufficient for production release.
- Real-device validation is required when relevant.
- Keep rollback and fallback paths until acceptance.

## Planning and documentation

Linear is the active roadmap/work-status system. GitHub is the source of truth for code, commits, pull requests, and technical documentation.

Update:

- `DESIGN.md` only for explicitly approved intended product behaviour;
- `DEVELOPMENT.md` when production state, roadmap, architecture, risks, migration, or next work changes;
- README when the public/current product summary becomes inaccurate;
- Linear when milestones, priority, status, or actionable scope changes.

Do not create speculative issue clutter. Create actionable issues with clear outcomes, acceptance criteria, dependencies, evidence impact, safeguards, and release level.

## Completion standard

Before reporting a substantial task complete, state:

- what changed;
- what did not change;
- tests run and results;
- manual/device checks completed and outstanding;
- learner-data, schema, authentication, deployment, and cost impact;
- rollback/fallback state;
- documentation and Linear updates;
- whether anything was actually merged or deployed.

Never claim an update, test, deployment, data change, or device verification occurred unless it did.
