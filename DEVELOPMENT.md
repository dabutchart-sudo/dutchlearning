# Dutch Learning — Development

## Current production state

- Production source: `origin/main`.
- Current documented release: **Zin V5.1.175**.
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

The owner confirmed V5.1.160 on the phone and saw the insufficient-unseen-test-sentences warning in normal F1 Learning. A read-only production progress export confirms that all 110 distinct F1 proof sentences were shown across five mastery tests (four failed, one passed) and one failed retention test; all have matching scored attempts. No V4 migration or incorrect seen flag explains the block. After the failed retention test, current policy requires another full 20-question mastery test, but no unseen F1 sentences remain. Practice cannot refill the proof pool; the current warning copy is misleading. Fifty new unseen questions would support one more failed mastery attempt, a passing mastery attempt and later retention, but the available simple combinations include verbs this learner has not practised; adding them directly to proof would be unfair. DAB-184 tracks the recovery decision and safeguards. See `docs/f1-proof-capacity-investigation.md`. Production data and runtime are unchanged by this investigation.

The owner approved a DAB-184 recovery path that keeps the existing proof thresholds and daily 20. Eight practice contexts introduce **nu** and 152 new F1 written-proof contexts use existing subject-and-verb forms with that word; learner-specific completed practice gates their eligibility. The old 110 proof questions and their exposure history remain unchanged. An exhausted learner first receives a recovery practice context and may then start a full test on the next study day. See `docs/f1-proof-capacity-investigation.md` for the diagnosis and the V5.1.161 section below for release evidence.

## DAB-184 F1 proof recovery — V5.1.161 release, 2026-10-02

The owner approved release of PR #137 after confirming a new **nu** practice sentence on the phone test build. It adds eight practice introductions and 152 distinct written-proof sentences; the new proof wording requires completed practice, while prior F1 proof eligibility and saved exposure history remain intact. The 20/day limit, 20-question mastery, 10-question delayed retention, 19/20 mastery threshold with 9/10 each direction, and strict 10/10 retention are unchanged. The misleading exhausted-capacity message now says practice cannot restore already-used test questions. A synthetic end-to-end regression uses 90 distinct test sentences through repeated failure, pass, and retention; a read-only check of the owner's export found an eligible recovery introduction. No learner-data rewrite, schema, auth, sync, service, or running-cost change was made. All 452 local tests, both PR checks, the post-merge main test run, and GitHub Pages deployment passed. PR #137 merged as `d3f722933b9062c27d13bf3f846335d5d52f9911`. Live `index.html`, `sw.js`, recovery content, registry, learner, and vocabulary gate match the merged source byte for byte. The offline cache is `dutch-v5.1.161-20261002-f1-proof-recovery`. On 3 October the owner confirmed that an F1 mastery test was offered and completed on the installed phone. Retention follows the normal later proof and was not part of this confirmation. Rollback is V5.1.160 source at `847ca2fc30df53ef2795a64a74fdf542731c38b5`; preserve learner history and the standalone Flashcards fallback. See `docs/dab-184-f1-proof-recovery-review.md`.

## DAB-178 first-mastery writing readiness — V5.1.162 release, 2026-10-02

The owner approved the first-mastery readiness rule and accepted the phone development sandbox before authorising production deployment on 2 October. PR #139 applies a 14-day, latest-12 unaided typed evidence window, ten-answer minimum, two study days with at least two answers each, and 80% grammar threshold after the existing 40-answer practice floor. Older incomplete evidence does not open a first mastery test; prior mastery history preserves the existing retake path. Course and Learning explain unmet evidence, and sync mapping preserves unknown help metadata. The 20/day limit, proof and retention thresholds, saved learner history, schema, authentication and services are unchanged. All 460 implementation tests passed before release preparation. The offline cache is `dutch-v5.1.162-20261002-typed-readiness`. Rollback is the V5.1.161 main source at `62327e7`; preserve learner history and the standalone Flashcards fallback. Final CI, Pages and installed-phone checks are recorded separately after release. See `docs/dab-178-typed-readiness-proposal.md`.

## DAB-178 test timing clarity — V5.1.163 release, 2026-10-02

After confirming V5.1.162 and synced progress on the phone, the owner reported that the topic screen still obscured when mastery or retention could next be taken. This UI follow-up makes both test timelines explicit above the practice action, distinguishes an earliest date from a conditional or unavailable date, and removes an inert disabled test button. The owner accepted the revised phone development view and separately approved release on 2 October. PR #140 merged as `e5777df72a3a67b58d08b685cc6939a82656e87a`. The main test run and GitHub Pages deployment passed, live files matched the merged source, and the owner confirmed installed-phone V5.1.163 with progress synced. Eligibility, daily limits, scoring, proof content, saved data, sync and services did not change. The offline cache is `dutch-v5.1.163-20261002-test-timing`. Rollback is V5.1.162 main source at `28b8268ee6bf2380aadd6c04944a048b263dc358`; preserve learner history and the standalone Flashcards fallback.

## DAB-180 retention-wait study path — V5.1.164 release, 2026-10-02

The owner approved opening the next topic's lesson and normal practice after a mastery pass, before the previous topic's delayed retention proof. The owner then confirmed the phone development sandbox worked well and authorised production release on 2 October. The change keeps the three-calendar-day delay, 20-question daily session, 10-question due retention proof, and separate retained state. A due retention proof takes priority; the successor's own mastery proof waits for its prerequisite to pass retention. If retention fails, the predecessor returns to recovery and already recorded successor practice is preserved but paused. Older retained topics remain eligible for normal maintenance. The route is derived from existing progress fields, so it requires no schema or learner-history rewrite. All 473 implementation tests passed before release preparation. The offline cache is `dutch-v5.1.164-20261002-retention-wait`. Rollback is V5.1.163 main source at `e5777df72a3a67b58d08b685cc6939a82656e87a`; preserve learner history and the standalone Flashcards fallback. Final CI, Pages and installed-phone checks are recorded separately after release. See `docs/dab-180-retention-wait-proposal.md`.

## DAB-170 sentence discrimination — V5.1.165 release, 2026-10-03

The owner authorised production release on 3 October. On a taught topic, optional Practice plays a hidden Dutch sentence and asks which of three written practice lines it was. The round has at most five questions and keeps its result in memory. A heard answer is a listening diagnostic for that session only. If audio is unclear or unavailable, the sentence is shown and the learner chooses its English meaning; that answer is recognition, not listening. The daily 20, learner history, mastery, retention, Flashcards, sync, schema, authentication, services, and running cost are unchanged. All 483 local tests and the PR #142 test checks passed before release. On the installed phone, Play produced a faint hiss and no words. The offline cache is `dutch-v5.1.165-20261003-listen-discriminate`. Rollback is the V5.1.164 main source at `060e4442dbffa6fe53f63766e798a50d18668e65`; preserve learner history and the standalone Flashcards fallback. See `docs/dab-170-sentence-discrimination.md`.

## Listen playback — V5.1.166 correction, 2026-10-03

The installed phone could hear a faint hiss and no Dutch words. That hiss was a near-silent unlock clip; the downloaded sentence started too late for the phone to treat it as part of the tap. V5.1.166 plays the prepared sentence itself when Listen is tapped, in the optional listening round and in the normal daily listening question. If the clip still cannot start, the screen says so instead of staying quiet. The speech service, daily 20, learner history, schema, authentication, and running cost are unchanged. On 3 October the owner finished the optional round on the installed phone at V5.1.166: 5 of 5 heard answers matched, every answer completed from audio, and the sentence stayed hidden. The offline cache is `dutch-v5.1.166-20261003-listen-words`. Rollback is the V5.1.165 main source at `a3f4efb32285cb2357061e0ac63af2580fcad895`; preserve learner history and the standalone Flashcards fallback.

## DAB-87 A1 checkpoint — V5.1.167 release, 2026-10-03

The owner asked for this slice on the live app. The integrated checkpoint is not a study topic. Course explains that it stays closed until requests, connecting ideas, and daily-life consolidation are in the course and every earlier topic is retained. Passing it will be Zin’s record of retained A1 capability, not an official certificate. There is no single score, no new proof, and no change to the daily 20, scheduler, or saved progress. All 489 local tests passed before release preparation. The offline cache is `dutch-v5.1.167-20261003-a1-checkpoint`. Rollback is the V5.1.166 main source at `6d6fbc1ce42b6afbf259164c83ce18d2ed23f3d2`; preserve learner history and the standalone Flashcards fallback. See `docs/dab-87-a1-checkpoint.md`.

## DAB-86 requests and service Dutch — V5.1.168 release, 2026-10-03

The owner asked for this slice on the live app. A1.23 is a course topic: polite requests, ordering, prices, help and repetition, with a lesson, guided practice and an unseen written proof pool. A1.24, A1.25 and the A1.26 checkpoint are still not study topics. The checkpoint stays closed and names only the topics that are still missing. Typed sentence work does not award speaking or interaction evidence. All 494 local tests passed before release preparation. The offline cache is `dutch-v5.1.168-20261003-a1-requests`. Rollback is the V5.1.167 main source at `e451892640dedd3b5254057bcb612d8ed24f4c37`; preserve learner history and the standalone Flashcards fallback. On 4 October 2026 the owner confirmed the installed-phone check of A1.23 and a native-speaker pass of its Dutch. This confirmation does not include a mastery or retention score. See `docs/dab-86-requests-service.md`.

## DAB-86 connecting ideas and daily life — V5.1.169 release, 2026-10-04

The owner asked for A1.24 and A1.25 on the live app together. A1.24 joins short ideas with en, maar, of and want, and sequences them with eerst, daarna and dan. A1.25 mixes home, family, work, food, transport, appointments and free time. An appointment is een afspraak. The A1.26 checkpoint is still not a study topic. It stays closed because earlier topics still need their delayed retention check, and the unseen written check is not in the course. Typed sentence work does not award speaking or interaction evidence. All 502 local tests passed before release preparation. The offline cache is `dutch-v5.1.169-20261004-a1-daily`. Rollback is the V5.1.168 main source at `9eab0c9aab8308dd361fa02b7e61e55902a5e87b`; preserve learner history and the standalone Flashcards fallback. On 4 October 2026 the owner confirmed the installed-phone checks of A1.24 and A1.25, a native-speaker pass of the new Dutch in those lessons, and that V5.1.169 is the live app. This confirmation does not include a mastery or retention score. See `docs/dab-86-connecting-ideas.md` and `docs/dab-86-daily-life.md`.

## DAB-171 simple problem — V5.1.170 release, 2026-10-04

The owner asked for this slice on the live app. S1 Explain a simple problem follows A1.25. It teaches reusable chunks for one situation: say you do not understand, that you or a train or bus are late, or that a phone or bicycle does not work, then ask for help with ik heb hulp nodig. A second idea can join with en, maar or want. It has a lesson, guided practice and an unseen written proof pool. Typed sentence work does not award speaking or interaction evidence. The daily 20, scheduler, learner history, schema, authentication and services are unchanged. A1.26 stays closed. All 506 local tests passed before release. The offline cache is `dutch-v5.1.170-20261004-a1-problem`. Rollback is the V5.1.169 main source at `ffdddde1b1e2993390acbf81857dd68f7a9a8e75`; preserve learner history and the standalone Flashcards fallback. On 4 October 2026 the owner confirmed the S1 Dutch is correct and confirmed an installed-phone check of the S1 lesson. This confirmation does not include a mastery or retention score. See `docs/dab-171-simple-problem.md`.

## DAB-171 introductions — V5.1.171 release, 2026-10-04

The owner asked for this slice on the live app. S2 Introduce yourself follows S1. It teaches reusable chunks for one situation: say your name with ik heet, ask politely with hoe heet u, say where you come from with ik kom uit, and say where you live with ik woon in. A second idea can join with en. It has a lesson, guided practice and an unseen written proof pool. Typed sentence work does not award speaking or interaction evidence. The daily 20, scheduler, learner history, schema, authentication and services are unchanged. A1.26 stays closed. All 510 local tests passed before release. The offline cache is `dutch-v5.1.171-20261004-a1-introductions`. Rollback is the V5.1.170 main source at `b518489728c11f32b5883e4bd5183b7747d00196`; preserve learner history and the standalone Flashcards fallback. On 4 October 2026 the owner confirmed a native-speaker pass of the S2 Dutch and confirmed an installed-phone check of this lesson. This confirmation does not include a mastery or retention score. See `docs/dab-171-introductions.md`.

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

A1.22 through A1.25 are in the live course, and S1, S2 and S3 are conversational chunks on the live course. A1.26 remains required course work, and curriculum expansion should align with the new communicative/scenario model rather than continuing as grammar coverage alone.

## DAB-189 plans — V5.1.172 release, 2026-10-04

The owner asked for this slice on the live app. S3 Arrange a simple plan follows S2. It teaches reusable chunks for one situation: name an appointment with ik heb een afspraak, say the time with om, and say you are coming with ik kom om. A second idea can join with en. It has a lesson, guided practice and an unseen written proof pool. Typed sentence work does not award speaking or interaction evidence. The daily 20, scheduler, learner history, schema, authentication and services are unchanged. A1.26 stays closed. All 514 local tests passed before release. The offline cache is `dutch-v5.1.172-20261004-a1-plans`. Rollback is the V5.1.171 main source at `d1c0319ce8c662849942da2c6930fc22b0037bb5`; preserve learner history and the standalone Flashcards fallback. On 4 October 2026 the owner confirmed a native-speaker pass of the S3 Dutch and confirmed an installed-phone check of this lesson. This confirmation does not include a mastery or retention score. See `docs/dab-189-plans.md`.

## DAB-190 course outcomes — V5.1.173 release, 2026-10-04

The owner asked for this slice on the live app and accepted the wording on 4 October 2026. The course path and topic page state what A1.22 through A1.25, S1, S2 and S3 let the learner do. This is presentation only. No new sentences and no new topic. Unlock rules, the daily 20, mastery, retention, learner history, schema, authentication and services are unchanged. A1.26 stays closed. All 516 local tests passed before release. The offline cache is `dutch-v5.1.173-20261004-course-outcomes`. Rollback is the V5.1.172 main source at `2ff6d9491313b50c3fa4effc4a2c36db00e93005`; preserve learner history and the standalone Flashcards fallback. An installed-phone check of the course path is still outstanding. See `docs/dab-190-outcomes.md`.

## DAB-191 assessed speaking — V5.1.174 release, 2026-10-05

The owner asked for this slice on the live app on 5 October 2026, after accepting the wording and setting the transcription spend limit at £5 per month. A taught topic offers an optional Practice activity: read an English sentence and say the Dutch. The comparison is about the words, not pronunciation. A spoken miss can be tried once more. Typing, or a recording that cannot be transcribed, is writing practice and is not speaking evidence. The activity does not use today’s 20 and does not change Course, mastery, retention, or saved history. Mastery and retention stay written. The daily skippable spoken question is unchanged. All 528 local tests passed before release. The offline cache is `dutch-v5.1.174-20261005-speaking-practice`. Rollback of the app is the V5.1.173 main source at `c80515ebf20585e153ab7b752d5b224820a4852a`; preserve learner history and the standalone Flashcards fallback.

The `speaking-transcription` function and its budget table stay in source. This environment has no Supabase access token, so the migration was not applied and the function was not deployed or enabled. On the live app, Record asks the learner to type. No provider key reaches the browser, and no new spend is added. `listen-tts` is unchanged. iPhone and MacBook checks of a real recording remain outstanding before any later Trial. DAB-191 stays in progress. DAB-172 stays open. See `docs/dab-191-speaking-practice.md`.

## DAB-185 missing heard word — V5.1.175 release, 2026-10-05

On 5 October the owner asked for the distractor fix and then for release, merge and deployment. On a taught topic, optional Practice plays a hidden Dutch sentence. Once the audio starts, the sentence appears with its finite verb replaced by a gap, and the learner chooses the heard word from three options. The two wrong options are verbs the topic already uses in the same sentence context, in the form that agrees with this subject. Every option is therefore a sensible, grammatical sentence, and only the audio decides. Forms of the heard verb are never options. The round has at most five questions and keeps its result in memory. If audio is unclear or unavailable, the gapped sentence and its English meaning are shown; that answer is recognition, not listening. Six topics offer the round: F1, F2, F3, F6, A1.4 and A1.5. The other topics need practice sentences that use different verbs in the same context. The daily 20, learner history, mastery, retention, Flashcards, sync, schema, authentication, services and running cost are unchanged. A headless phone-width run covered the hidden start, both audio-failure paths, the summary and leaving the round. A heard round on the installed iPhone app and on the MacBook is still outstanding. The offline cache is `dutch-v5.1.175-20261005-missing-word`. Rollback is the V5.1.174 main source at `79280f2`; preserve learner history and the standalone Flashcards fallback. See `docs/dab-185-missing-word.md`.

## Active milestone

### Conversational Dutch, remaining steps — 4 October 2026

The live app is Zin V5.1.175. Trustworthy progress, the question-format contracts, and the first daily listening and speaking beats are already in the course.

Listening has hidden-text meaning selection and optional sentence discrimination. The installed phone confirmed that discrimination plays Dutch words. Missing heard word is on the live app as optional Practice in V5.1.175 (DAB-185); a heard round on the installed phone is still outstanding. Short dictation, two-line exchange comprehension, and controlled voice or speed are not in the course. DAB-170 stays open for those steps, as DAB-185, DAB-186, DAB-187, and DAB-188. Each starts in optional Practice.

Directions, requests, connecting ideas, daily life, a simple problem, introductions, and arranging a simple plan are live. On 4 October 2026 the owner confirmed the installed-phone checks of the S1, S2 and S3 lessons, and a native-speaker pass of the S3 Dutch. The S1 and S2 Dutch was already accepted. These confirmations do not include a mastery or retention score. DAB-190, the course outcome map, is on the live app as V5.1.173. The owner accepted the wording on 4 October 2026. An installed-phone check of the course path is still outstanding. DAB-171 stays open.

The owner asked for the first optional speaking Practice loop on the live app on 5 October 2026. It is V5.1.174. Record on the live app asks the learner to type, because the production transcription function and its £5 monthly budget table have not been deployed. The agreed ceiling stays £5 per month for when that function is switched on. The activity does not use today’s 20, and mastery and retention stay written. DAB-191 stays in progress until an installed-phone check and a MacBook check of a real recording are done, and until speech can be scored under that cap. DAB-172 stays open because the wider spoken-answer loop is not finished. DAB-173 waits for that loop. DAB-174 stays later. A1.26 stays closed under DAB-87 until earlier topics are retained and the unseen written check is in the course. DAB-182 still needs an owner decision before course words enter Flashcards.

### Question quality and teaching audit — completed

DAB-168 established the format catalogue, capability evidence vocabulary, reversible release controls, and first optional listening Practice slice. DAB-88 audited whether the live course teaches and tests fairly before further conversational expansion.

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
