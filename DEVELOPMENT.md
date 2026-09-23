# Dutch Learning — Development

## Current production state

- Production source: `origin/main`.
- Current documented release: **Zin V5.1.141**.
- Production study origin: `https://dabutchart-sudo.github.io/dutchlearning/`.
- Delivery: GitHub Pages / installable PWA.
- Persistent signed-in state: Supabase.
- Course is home; the normal Learning session contains 20 questions.
- The daily 20 includes one listening beat and, when enabled, one skippable speaking beat.
- Mastery and retention proofs remain finite written checks.
- Integrated Flashcards are the accepted normal platform. The standalone app remains a reversible fallback.
- Automated regression tests run with `npm test`.

Production is live learning software containing genuine learner history. Documentation changes do not themselves change application behaviour, learner data, deployment, or schema.

The production `generate-sentences` and `listen-tts` Supabase Edge Functions use the server-side `OPENAI_API_KEY`. Treat deployed functions, owner/Google authentication, quota controls, and the deliberate internal-auth boundaries as protected production contracts. Do not recreate or redeploy them from assumptions.

## Agreed development direction — 2026-09-23

The owner has approved evolving Zin incrementally into the primary method for learning conversational Dutch.

This is an expansion of the proven live course, not a rewrite. Work proceeds on three coordinated tracks:

1. conversational capability;
2. question-format quality and fairness;
3. evidence-based progress visualisation.

The delivery order is:

1. baseline, feature flags, question catalogue, and evidence model;
2. question-format consolidation and teaching-quality audit;
3. course journey, capability profile, and retention/activity reporting;
4. deeper listening;
5. conversational chunks and real-life scenarios;
6. assessed spoken answers;
7. controlled dialogues;
8. broader, less predictable listening and conversation.

A1.22–A1.26 remain required course work, but curriculum expansion should align with the new communicative/scenario model rather than continuing as grammar coverage alone.

## Active milestone

### Question quality and teaching audit

DAB-168 established the format catalogue, capability evidence vocabulary, reversible release controls, and first optional listening Practice slice. DAB-88 now audits whether the live course teaches and tests fairly before further conversational expansion.

The source-backed findings are recorded in `docs/question-quality-audit.md`. The first implementation slice now combines proof-pool safety with the owner-approved 19/20 mastery rule: mastery requires at least 9/10 in each direction, a single missed item creates targeted follow-up, A1.7–A1.12 have sufficient unseen proof for one failure plus retry and retention, and retention remains strict at 10/10. Production promotion still requires owner review and phone acceptance.

The completed conversational-foundations milestone established the structure needed to add conversational learning safely.

Required outcomes:

- catalogue every current question format and the evidence it records;
- define the shared format contract for teaching, support, feedback, scoring, fallback, persistence, and mobile presentation;
- distinguish independent, supported, and revealed success;
- define the capability evidence model;
- define Course Journey, Capability Profile, and Retention/Activity progress views;
- introduce a reversible Experimental → Practice → Trial → Core promotion mechanism;
- preserve daily-session, Flashcard, Supabase, PWA, and production-recovery behaviour;
- select and deliver one bounded first vertical slice: hidden-text listening with meaning selection in optional Practice.

Implementation started in DAB-168. The source-backed catalogue is in `docs/question-format-catalogue.md`; `src/engine/question-formats.js` provides the read-only, backward-compatible contract registry and automated coverage check. `src/engine/format-release.js` adds isolated context gating, a kill switch, sequential owner-approved promotion, and immediate rollback. The first optional Practice slice uses these foundations for five hidden-text listening questions with session-only diagnostics and a visible-text fallback. It remains separate from scheduling, permanent learner evidence, mastery, retention, Flashcards, and the daily 20.

This milestone changes documentation and planning first. Application work begins only through scoped issues/PRs.

## Roadmap and release gates

### Phase 0 — Baseline and safeguards

- Inventory formats, evidence writes, help paths, and failure behaviour.
- Confirm current production baseline and open work before implementation.
- Add feature flags or isolated test routes.
- Strengthen regressions for the 20-question close, teaching-first flow, five-new-card ceiling, completion persistence, and safe resume.
- Confirm optional-service failure cannot block normal study.

**Gate:** an experimental format can be enabled, disabled, and rolled back without changing production learning history or preventing a daily session.

### Phase 1 — Question quality

- Standardise prompt, answer, help, Check Answer, and feedback positions.
- Formalise teaching vs assessment and independent vs supported evidence.
- Keep capitalization scoring fair.
- Prevent spelling from blocking concept/grammar progression.
- Use a 19/20 grammar pass threshold for mastery, with at least 9/10 correct in each direction. A missed item creates targeted follow-up rather than being silently ignored. Retention remains a separate, stricter 10/10 check.
- Finish the teaching-quality audit.
- Add ambiguity and natural-Dutch review to content acceptance.

**Gate:** existing question families have documented contracts, regression coverage, and owner acceptance on phone-sized layouts.

### Phase 2 — Progress foundation

- Preserve Course as home.
- Show course position and topic states: Not started, Learning, Practising, Proven, Retaining, Needs attention.
- Add a capability profile across Vocabulary/Recall, Grammar/Construction, Reading, Listening, Writing/Production, Speaking, and Interaction.
- Keep retention/activity and Flashcard reporting distinct.
- Explain what evidence changes a state.
- Do not award listening from visible-text playback, speaking from typed fallback, or interaction from isolated questions.

**Gate:** the owner understands and trusts why progress changed and no single percentage implies balanced conversational ability.

### Phase 3 — Listening depth

Progress through:

1. known-sentence playback;
2. hidden-text meaning selection;
3. sentence discrimination;
4. missing heard word;
5. short dictation;
6. two-line exchange comprehension;
7. controlled voice and speed variation.

**Gate:** listening is measured independently from reading, service failure falls back safely, and iPhone/PWA behaviour is validated.

### Phase 4 — Chunks and scenarios

- Schedule reusable conversational chunks as complete learning objects.
- Add communicative objectives such as introductions, family/home, ordering, plans, directions, and simple problems.
- Map grammar topics to situations in which the learner can use them.
- Reuse known vocabulary while varying phrasing.

**Gate:** each completed block supports at least one genuine real-life outcome.

### Phase 5 — Assessed speech

- Implement prompt → spoken response → transcription → focused feedback → retry → later review.
- Prioritise intelligibility and retrieval over native-accent imitation.
- Keep typed fallback, but do not award speaking evidence for it.
- Keep credentials server-side and apply authentication and spend quotas.

**Gate:** reliable on iPhone and MacBook; speech failure never blocks daily completion.

### Phase 6 — Controlled dialogue

- Add bounded two-to-four-turn exchanges.
- Allow several correct responses and optional phrase support.
- Include repeat/clarify/repair controls.
- Provide consolidated feedback after the exchange where practical.
- Start in optional Practice before limited daily Trial use.

**Gate:** common A1 exchanges can be completed without memorising one exact response.

### Phase 7 — Broader conversation

- Add phrasing variation, unfamiliar combinations of known language, longer audio, freer answers, idiomatic feedback, and conversational repair.
- Treat open-ended conversation as optional extra study unless explicitly approved for a bounded daily role.
- Consider realtime architecture only after a separate decision and production-safety review.

**Gate:** evidence shows earlier controlled formats are dependable and affordable.

## Question-format delivery standard

Every question implementation or substantial revision must specify:

- learning capability and stage;
- teaching/practice/proof role;
- answer and ambiguity rules;
- help and evidence consequences;
- success, near-miss, and failure feedback;
- repeated-failure behaviour;
- offline/service-failure fallback;
- mobile layout;
- persistence/resume behaviour;
- automated and manual tests.

New formats move through:

| Level | Availability | Progress effect |
| --- | --- | --- |
| Experimental | Isolated developer/test route | None |
| Practice | Optional learner-facing activity | Diagnostic only |
| Trial | Small controlled daily share | Limited evidence |
| Core | Normal adaptive session | Full relevant evidence |

Promotion requires owner acceptance and evidence that production study remains dependable.

## Progress implementation rules

Maintain separate models for:

- **Course journey** — location and next objective;
- **Capability profile** — what can be demonstrated;
- **Retention/activity** — whether learning is sticking and study is occurring.

Evidence must be capability-specific. Help usage must remain visible to the evidence engine even when internal status is hidden from the learner during a question.

Do not add gamified substitutes for progress.

## Architecture and data boundaries

The project remains a lightweight web/PWA application with Supabase-backed persistence. Changing the provider, model strategy, application architecture, hosting platform, Supabase role, authentication design, scheduler, daily-completion contract, or reporting model requires explicit owner approval.

Do not alter Supabase tables, schema, policies, migrations, functions, authentication settings, or production data as an incidental part of a UI or exercise change. Prefer additive/backwards-compatible work and establish rollback before high-impact changes.

Never commit API keys, secrets, service-role keys, passwords, or private credentials.

## Agent/Cursor workflow

Before editing:

1. Read `AGENTS.md`, `DESIGN.md`, this file, the relevant Linear/GitHub issue, implementation, tests, and `git status`.
2. Confirm the production baseline and create a focused branch/checkpoint.
3. State the bounded objective and expected files.
4. Identify application, data, deployment, cost, mobile, and rollback impact.

During implementation:

- keep one coherent scope;
- preserve unrelated behaviour;
- avoid opportunistic refactors;
- add focused regression coverage;
- do not silently promote Experimental or Practice work into the daily Core session.

Before handoff:

1. review the exact diff;
2. run focused tests and `npm test` for behaviour changes;
3. run whitespace/link validation for documentation-only work;
4. report files, tests, data/deployment impact, costs, risks, and manual checks;
5. leave a recoverable branch;
6. do not merge, deploy, mutate production data, or remove a fallback unless explicitly authorised.

## Testing requirements

Protect regression coverage for:

- teaching before assessment;
- exactly 20 normal Learning questions;
- finite 20-question mastery and 10-question retention proofs;
- hard adjustable new-card ceiling, currently 5;
- no normal-session refill after completion;
- Flashcard batch scheduling and retention reporting;
- safe local/remote learner-state recovery;
- gradual English-to-Dutch production;
- capitalization tolerance where appropriate;
- separate spelling and concept evidence;
- hold-to-show assistance;
- listening/speaking substitution and failure fallback;
- one-screen mobile layout and pinned action;
- PWA cache/update behaviour when relevant.

Use real-device testing for iPhone audio, microphone, recognition, installed-PWA cache, layout, and cross-device synchronisation.

## Release discipline

A change is complete only when the relevant acceptance criteria, automated tests, manual/device checks, learner-data protection, rollback, documentation, and issue/PR updates are complete.

Production study must remain available. A feature being technically mergeable does not make it ready for Core use or deployment.

## Immediate next work

1. Complete the question-format catalogue and evidence map.
2. Convert the open teaching-quality audit into format-specific acceptance work.
3. Specify the three-part progress model against existing learner data.
4. Implement the feature-promotion mechanism.
5. Build hidden-text listening with meaning selection as the first optional Practice vertical slice.
6. Continue A1.22 content in a way that supports communicative/scenario objectives.
7. Keep the standalone Flashcards fallback until a separate retirement decision.
