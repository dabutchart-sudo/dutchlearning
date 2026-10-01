# Dutch Learning — Development

## Current production state

- Production source: `origin/main`.
- Current documented release: **Zin V5.1.160**.
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

## Mastery retake timing — 2026-09-24

A failed mastery test becomes eligible on the next study day without eight successful remedial answers. The test still needs all 20 daily questions. Earlier saved failures are recognised from proof history without rewriting learner data. Retention failure behaviour is unchanged. Release cache: `dutch-v5.1.147-20260924-mastery-retake`.

## A1.7–A1.9 practice breadth — 2026-09-28

V5.1.148 releases the additive A1.7 negation, A1.8 question-word and A1.9 perfect-tense-with-zijn practice pools after owner phone acceptance. Each grows from 10 to 20 contexts. The lesson action remains visible on a phone while longer teaching content scrolls. Existing sentence IDs, proof material, mastery and retention rules, learner history, Supabase schema, authentication and services are unchanged. The offline cache is `dutch-v5.1.148-20260928-a17-a19-practice`. Rollback is to the V5.1.147 production commit; keep learner history and the standalone Flashcards fallback.

## DAB-176 fair tests and personal readiness — 2026-09-28

V5.1.149 added complete A1.7–A1.21 sentence vocabulary metadata, missing English meanings, clarified English “you” prompts, conservative accepted time-fronting, format-suitability scheduling and an automated content audit. The initial audit found 329 proof sentences containing at least one word absent from earlier or same-topic course practice. With owner-approved scope expansion, 151 curated practice contexts introduced those words before their topic's proof pool; the content-level audit reported zero gaps. New practice does not duplicate proof. Existing A1.9 perfect-tense verb slots and one A1.19 finite-verb index were repaired. A learner-specific gate counts completed practice answers, waits for at least 30 familiar-word unseen items before mastery (20 for mastery and ten held for retention), and waits for ten before retention. Normal practice favours contexts that make more proof items eligible. The 40-answer minimum and daily 20 remain; a lesson reveal or unanswered question does not count as practice. No learner-data, schema, authentication or service change was required. The offline cache was `dutch-v5.1.149-20260928-a1-fair-proof`.

## DAB-175 and phone Flashcards release — 2026-09-28

V5.1.150 adds versioned bilingual proof patterns for A1.7–A1.21. Original sentence IDs remain intact. The `npm run audit:proof` command counts only unique proof wording that does not collide with prior course exposure or current practice and uses vocabulary introduced by practice. The measured effective capacity is 90–124 per topic. Tests simulate three failed 20-question mastery days, a fresh passing 20-question day, and delayed 10-question retention for every topic, checking all 90 sentences are distinct. The phone Flashcards summary now shows its four figures on one compact row. The owner accepted the combined phone preview and approved production release. Existing learner-specific vocabulary readiness and safe capacity explanations remain in force. The 20/day limit, 40-answer minimum, written scoring, learner data, Supabase schema, authentication, and services are unchanged. The offline cache is `dutch-v5.1.150-20260928-proof-capacity`. Rollback is the V5.1.149 production commit and the standalone Flashcards fallback. A separate human Dutch-language review of the new proof sentences has not been recorded.

## DAB-177 grammar review scheduling — production release, 2026-09-29

The owner approved the policy in `docs/dab-177-grammar-review-proposal.md`. V5.1.151 applies a 3/7/14/30-day grammar review ladder, next-day independent review after a miss, due-date priority, and an adaptive daily budget capped at six within the existing 20. An optional V5 progress field tracks the interval step; existing due dates and proof history remain intact. Focused scheduling and cross-device simulation tests and the full automated suite pass. The owner confirmed the development preview on iPhone and MacBook; 428 local tests, GitHub CI and the GitHub Pages build passed. V5.1.151 is deployed at the production study origin and the signed-in Mac app loaded existing F1 progress with “Progress synced.” The owner approved live iPhone sync verification after release, and that comparison is pending. No production data rewrite, Supabase schema, authentication, or service change was made. Rollback is the V5.1.150 source and the standalone Flashcards fallback.

## UI Stage 1 — local candidate, 2026-09-30

V5.1.152 is a local Stage 1 interface candidate based on the verified V5.1.151 production `main` baseline. It adds a consistent app shell with icon navigation, a visible version, and a sync detail view that distinguishes confirmed Learning sync from Flashcards connection and save results. The outdated Settings statement that V5 never syncs automatically is corrected. Learning and Flashcard progression, proof requirements, scheduling, storage formats, Supabase schema, authentication, services, and hosting are unchanged. No merge or deployment has been made. See `docs/ui-stage-1-review.md` for checks and remaining device review.

The owner accepted the Stage 1 interface after reviewing the compact Course header, reduced Course copy, and direct Flashcard start. This is design acceptance of the local candidate; release and real-device verification remain separate steps.

## UI Stage 2 — local candidate, 2026-09-30

V5.1.154 builds on the accepted Stage 1 branch and updates Course and topic presentation. The current topic and its next action appear before the compact timeline; locked topics state the prerequisite; practice counts and proof guidance sit in expandable topic details. A follow-up correction keeps the bottom navigation visible during Learning and reserves space above it for the question controls. The existing evidence calculations, unlock rules, daily 20, proof gates, extra practice, storage, and sync paths are unchanged. The complete automated suite passes (427 tests). The owner approved proceeding to Stage 3 after the navigation correction. Phone checks remain; no merge or deployment has been made. See `docs/ui-stage-2-review.md`.

## UI Stage 3 — local candidate, 2026-09-30

V5.1.155 builds on the Stage 2 checkpoint and simplifies the Learning question shell. A finite count and topic stay at the top, the Pause action is an icon, proof rules and answer scoring details are available on demand, and full sentence teaching feedback stays visible. Word help no longer repeats its instruction. The Check answer and Continue action remains above bottom navigation. The complete automated suite passes (430 tests). The owner confirmed the Learning layout and Pause action on iPhone. Evidence calculations, daily limits, proof gates, persistence, sync, learner data, and services are unchanged. See `docs/ui-stage-3-review.md`.

## UI stages 1–3 — production release, 2026-09-30

The owner approved release after reviewing Stage 3 and confirming its Learning question, evidence disclosure, bottom navigation, and Pause action on iPhone. PR #121 passed GitHub Actions and merged as `5af7e4ef92813f43a8b935f207fd39c47287540a`. GitHub Pages serves V5.1.155; the published service worker, Learning UI helper, and shell stylesheet match the tested source. The offline cache is `dutch-v5.1.155-20260930-ui-learning`. After release, the owner confirmed the installed phone app's V5.1.155 version and sync status. No learner-data rewrite, Supabase schema, authentication, service, scheduling, or running-cost change occurred. Rollback source is V5.1.151 at `c9f4f08cc0a21d4d9b76148ebe86e0e316eee554`; the standalone Flashcards app remains available.

## DAB-181 teaching support — production release, 2026-10-01

V5.1.156 builds on the verified V5.1.155 release checkpoint. The lesson presents concise pattern notes for A1.7–A1.22 and two additional examples drawn only from that topic's practice pool. Normal practice offers an optional pattern reminder: prominent during the first eight practice answers and less prominent thereafter. Opening it records the existing assisted-answer flag, so it cannot award independent Dutch writing evidence; proof questions have no reminder. Grammar misses show a topic-specific pattern tip beside the complete model sentence and meaning. After the daily 20, Course shows a read-only recap of those 20 answers and up to three sentences worth revisiting. A teaching-coverage test maps all current A1.7–A1.21 proof sentences to a taught pattern with representative practice. Twenty-nine additive contexts fill the remaining under-20 practice pools in A1.14–A1.16, A1.18 and A1.20 and cover a missing A1.7 negation contrast. Content tests check meanings, word metadata, proof separation and format scoring. The recap adds no questions or saved fields. The daily limit, scheduling, proof rules, learner data, sync, Supabase schema, authentication, services, and costs are unchanged. The owner authorised release on 1 October. The 438 local tests and PR #124 GitHub Actions test workflow passed; PR #124 merged as `28eb4e275ef55e5ef3d06de621036152f8734c24`. GitHub Pages serves V5.1.156, and the published shell, service worker, UI modules and new content module match the tested source byte for byte. The offline cache is `dutch-v5.1.156-20260930-teaching-recap`. A separate iPhone/installed-PWA check and human Dutch-language review of the new teaching notes and contexts were not recorded. Rollback is the V5.1.155 production source at `17427f3e6b816b0007947791e9de528a1e7e6ec6`; the standalone Flashcards fallback remains available. See `docs/dab-181-teaching-review.md`.

## DAB-88 format-choice fairness — production release, 2026-10-01

V5.1.157 corrects a wrong `form` choice from Meaning to Verb form feedback. It also removes five valid `jij kunt` alternatives from `correct-sentence` distractors when `jij kan` is the model, while accepting those alternatives in older saved questions. Wrong sentence-choice options now give verb-form or word-order feedback. The daily limit, progression, proof rules and stored-field shape remain unchanged. The owner authorised deployment on 1 October. All 440 local tests and the PR #126 and post-merge GitHub Tests workflows passed. PR #126 merged as `19b38047c72a98b024030220918fbe2d45bb2ae9`; GitHub Pages deployment succeeded. Live `index.html`, `sw.js`, `exercises.js` and `scoring.js` match the release source byte for byte. The offline cache is `dutch-v5.1.157-20261001-choice-fairness`. Human Dutch and installed iPhone/PWA checks were not recorded. Rollback is the V5.1.156 source at `653284a10ea326c9f815b2f686127081eb97abcf`; the standalone Flashcards fallback remains available. See `docs/question-quality-audit.md`.

## DAB-179 failed-mastery recovery — production release, 2026-10-01

The review candidate groups missed mastery patterns by direction and error type, with a complete Dutch model sentence and English meaning. Up to three patterns feed existing daily practice; after repeated failure, Dutch production starts with a guided word-bank step if the learner chooses practice. The full 20-question next-study-day retake, 19/20 overall and 9/10 each direction, strict delayed 10/10 retention, proof novelty and daily 20 are unchanged. A focused shorter retest is not included because it cannot demonstrate the current independent standard without a new owner-approved proof rule. Recovery uses existing attempts and retry records, with no data migration or service change. The owner accepted the phone development preview and approved production release on 1 October. All 443 local tests, both PR #128 test runs, the post-merge main test run and GitHub Pages deployment passed. PR #128 merged as `96b9cfa19877ed6b23c5a247007126a1a2a8cc1f`. The live `index.html`, `sw.js`, recovery engine, learner, scheduler, app UI and Course CSS match the release source byte for byte. The offline cache is `dutch-v5.1.158-20261001-mastery-recovery`. After release, the owner confirmed the installed phone app shows V5.1.158 with progress synced. Rollback is V5.1.157 source at `b0f5b47`; keep learner history and the standalone Flashcards fallback. See `docs/dab-179-mastery-recovery-review.md`.

## DAB-169 trustworthy progress — production release, 2026-10-01

The Course journey now derives Not started, Learning, Practising, Proven, Retaining and Needs attention from existing topic progress and proof history, with a short explanation of the evidence and next step. The Course evidence view adds separate counts for vocabulary recall, grammar construction, reading, listening, writing, speaking and interaction. It classifies only recorded attempts with matching formats and support state; empty or older incomplete evidence stays unproven. A passed mastery test is stated separately from guided practice. Learning trends and the separate Flashcard report remain available. This is a read-only interpretation: no learner-history rewrite, schema, sync, scheduler, daily-session, proof, service or cost change. The owner accepted the development phone preview and approved deployment on 1 October. All 446 local tests, both PR #131 checks, the post-merge main test run and GitHub Pages deployment passed. PR #131 merged as `83f486f8142d23bfca3e2adccb3b8418f0e6a011`. Live `index.html`, `sw.js`, capability and Course progress modules, Course UI and CSS match the release source byte for byte. The offline cache is `dutch-v5.1.159-20261001-trustworthy-progress`. After release, the owner confirmed the installed phone app shows V5.1.159 with progress synced. Rollback is V5.1.158 source at `f0ceeb4`; keep learner history and the standalone Flashcards fallback. See `docs/dab-169-progress-review.md`.

## Mastery offer readiness — V5.1.160 release, 2026-10-01

An initial mastery offer now checks the documented practice minimum as well as the saved test-ready state. This guards older or inconsistent progress without changing recorded history. A saved failed mastery still permits the next-study-day full retake. Course presents an eligible test as a choice alongside continued practice. A follow-up to the owner's phone report makes test-start failures visible on the test screen and checks unseen compatible test capacity before an offer or start. The actual phone error remains unobserved. The owner approved production release on 1 October. All 450 local tests, PR #134's test job, the post-merge main test job and GitHub Pages deployment passed. PR #134 merged as `9fe0dce7f18b092ed9d76261d28397483f08318e`. Live `index.html`, `sw.js`, app UI, learner, scheduler and Course CSS match the tested release source byte for byte. The offline cache is `dutch-v5.1.160-20261001-mastery-start`. The daily limit, proof standards, saved learner data, sync, schema, authentication, services and costs are unchanged. Rollback is V5.1.159 source at `c8e65069c7bca1ac9033cc5d984e68f01fed406d`; retain learner history and the standalone Flashcards fallback. Installed-phone validation of the V5.1.160 start path remains pending. See `docs/mastery-offer-readiness-review.md`.

## F1 proof-capacity incident — investigation, 2026-10-01

The owner confirmed V5.1.160 on the phone and saw the insufficient-unseen-test-sentences warning in normal F1 Learning. F1 has 110 distinct compatible proof sentences; five fully failed 20-question tests would leave ten, reproducing the warning. Actual saved exposure and proof-history counts remain uninspected, so the cause in this learner's state is not yet confirmed. Practice cannot refill the proof pool; the current warning copy is misleading. See `docs/f1-proof-capacity-investigation.md`. Production data and runtime are unchanged by this investigation.

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

A1.22 is included; A1.23–A1.26 remain required course work, but curriculum expansion should align with the new communicative/scenario model rather than continuing as grammar coverage alone.

## Active milestone

### Question quality and teaching audit

DAB-168 established the format catalogue, capability evidence vocabulary, reversible release controls, and first optional listening Practice slice. DAB-88 now audits whether the live course teaches and tests fairly before further conversational expansion.

The source-backed findings are recorded in `docs/question-quality-audit.md`. The first implementation slice now combines proof-pool safety with the owner-approved 19/20 mastery rule: mastery requires at least 9/10 in each direction, a single missed item creates targeted follow-up, A1.7–A1.12 have sufficient unseen proof for one failure plus retry and retention, and retention remains strict at 10/10. The proof-safety and mastery-fairness slice is now in the production source; phone acceptance remains to be checked.

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

## V5.1.146 A1.22 and mastery proof safety — 2026-09-23

This release combines A1.22 directions and location with DAB-88 proof safety. A1.22 follows A1.21 as a separate mastered and retained concept. The mastery proof now passes at 19/20 with at least 9/10 in each direction, records the missed item for targeted follow-up, and keeps retention strict at 10/10. A1.7–A1.12 have larger unseen proof pools so a failed attempt can be retried. The offline cache includes the new content. Learner history, Supabase schema and authentication are unchanged. Confirm V5.1.146 on a fresh production load and check the A1.22 lesson on a phone. Do not delete browsing data.

## DAB-88 practice breadth — 2026-09-27 (local review)

The next bounded audit slice expands A1.7 negation practice from 10 to 20 contexts, with a minimum of ten subjects and ten verbs. Existing record identities and proof material are preserved. Added rows are validated across their declared formats and against all registered proof text. No scheduler, learner-data, schema, authentication, service, cost or production-release change is included. Phone/PWA acceptance remains outstanding. Continue practice breadth for later ten-item pools, then ambiguity, format enforcement and teaching coverage in the audit's agreed order.

## DAB-88 A1.8 practice breadth — 2026-09-27 (local review)

A1.8 question-word practice now has 20 contexts, four each for waar, wat, wanneer, hoe and wie, spanning at least ten verbs and ten subjects. Added Dutch sentences are distinct from all registered course text. Existing identities, teaching and proof records are preserved; daily scheduling, learner history, services and production-release settings are unchanged. Phone/PWA acceptance remains outstanding. Next: A1.9 practice breadth, then the later small pools before ambiguity, format enforcement and teaching coverage.

## DAB-88 A1.9 practice breadth — 2026-09-27 (local review)

A1.9 perfect tense with zijn practice now has 20 contexts across 16 subjects. All six existing verb families have at least three examples; no new verb family is introduced. Added Dutch sentences are distinct from all registered course text. Existing record identities, teaching and proof material are preserved, including A1.10. No learner-data, scheduler, schema, authentication, service, cost or production-release changes are included. Phone/PWA acceptance remains outstanding. Next: A1.10 separable-verb practice breadth, followed by later small pools and the remaining audit work.
