# Question-quality audit

Status: audit complete; first proof-safety and mastery-fairness slice implemented for review, 23 September 2026.

Release update, 28 September 2026: the owner accepted the A1.7–A1.9 development preview for production. V5.1.148 includes their expanded practice pools and the phone lesson-action layout fix. Earlier local-review notes below record the state before this release. The broader A1.10–A1.21 breadth, ambiguity, vocabulary and proof-capacity work remains open under DAB-88 and its follow-up stories.

## DAB-176 test-fairness audit — 28 September 2026 (development only)

The focused branch inventories every surface word in all 860 A1.7–A1.21 sentence records, supplies English glosses for the missing target verbs, distinguishes singular/plural English “you” prompts, accepts conservative time-fronting alternatives with Dutch inversion, and enforces `suitableKinds` in normal practice selection. Focused validation exercises every declared format and detects missing vocabulary metadata, ambiguous duplicate prompts and incompatible proof formats. This branch has not been merged or released.

The vocabulary prerequisite scan compares proof sentences with earlier course practice and the current topic's practice pool. **329 proof sentences contain at least one word absent from those practice pools.** This count does not assert that the learner has never met a word in Flashcards or elsewhere; it shows that the course itself cannot guarantee practice before testing it. Fixing all such cases requires substantial additional practice contexts or proof-content changes, and must be coordinated with DAB-175 proof capacity and DAB-181 teaching breadth. Merely showing a word in a briefing is not counted as practice. Do not mark DAB-176 complete or promote this branch until the proof-vocabulary condition and phone acceptance are resolved.

This audit examines the production content and scoring architecture. The first bounded response changes mastery scoring and adds curated proof capacity without rewriting learner history, Supabase data, or the daily scheduler.

## Executive finding

Hard-coded course content is not itself a problem. Curated, versioned sentences make Zin deterministic, testable, available offline, and safer for scored learning than unrestricted runtime generation. The current risks come from pool capacity, repetition, exact-answer assumptions, and contracts that are recorded but not always enforced.

## Measured baseline

- 27 implemented concepts: F1–F6 and A1.1–A1.21.
- 3,372 sentence records: 1,527 practice and 1,845 proof.
- Every concept requires 40 practice answers before mastery proof.
- A1.7–A1.21 each have only 10 practice sentences, so the learner must encounter each sentence about four times on average before proof, even before retries.
- A1.7–A1.12 each have only 32 proof sentences.
- Only 20 sentence records declare accepted Dutch alternatives, all for `jij wil/wilt` or `jij kan/kunt` in F6.
- One same-concept English prompt is structurally ambiguous: “Where do you live?” maps to both singular `Waar woon jij?` and plural `Waar wonen jullie?` in A1.8, without accepted alternatives.
- 24 later proof records duplicate Dutch sentences already present in an earlier concept. Because proof selection excludes previously exposed Dutch text globally, these records may not remain available when the later concept is reached.

## Findings by severity

### Critical — failed mastery can exhaust unseen proof

A mastery test consumes 20 unseen proof sentences and retention consumes another 10. Before this slice, A1.7–A1.12 contained only 32 proof sentences. A simulated mastery failure in A1.7 left 12 unseen sentences; after the required remediation, starting the next 20-question mastery test threw `Not enough unseen proof sentences remain in this pack`.

This is a progression blocker, not merely a content-quality concern. The same structural risk exists anywhere the effective proof pool cannot support failures, a later successful mastery test, and retention.

Implemented response: A1.7–A1.12 now each have at least 52 unique proof sentences. Regression coverage exercises failure → eight successful remedial answers → fresh mastery retry → delayed retention without recycling exposed proof.

Required response:

- never offer a proof that cannot complete safely;
- provide enough effective, non-duplicated proof capacity for at least one failed mastery, one later mastery, and retention;
- add regression coverage for fail → remediate → retry → retain;
- preserve genuine unseen proof rather than silently recycling memorised test sentences.

### High — later practice pools encourage sentence memorisation

A1.7–A1.21 use 10 practice sentences for 40 required attempts. The scheduler varies kind and avoids the most recent sentence/verb where possible, but it cannot create new linguistic contexts. Success may therefore reflect memory for ten fixed sentences more strongly than transfer of the underlying pattern.

Required response:

- increase curated practice breadth or introduce constrained, validated variants;
- measure unique contexts, subjects, verbs, vocabulary, and structures rather than record count alone;
- keep runtime AI out of scored progression unless its output is validated and accepted into a versioned content pack.

### High — mastery scoring is brittle

Mastery now requires 19/20 grammar overall, with at least 9/10 in each direction. A 19/20 pass records the missed item for targeted follow-up. Spelling and capitalisation remain separate unless they change grammar or meaning. Retention remains strict at 10/10.

### Medium — exact English prompts can conceal Dutch distinctions

The A1.8 prompt “Where do you live?” is used for both `jij` and `jullie`. In English → Dutch work, either Dutch sentence can be reasonable without additional context, but neither record accepts the other answer. Prompt context or accepted alternatives must preserve the intended singular/plural distinction.

The audit should expand from exact duplicate detection to a human naturalness/ambiguity review, especially for English prompts with several valid Dutch renderings.

### Medium — declared format suitability is not enforced in normal scheduling

Sentence records declare `suitableKinds`, but normal practice selection does not filter the pool using it. The optional listening route does. Current later packs mostly declare the same broad set of kinds, so the metadata cannot yet protect against a semantically unsuitable question format.

Required response:

- enforce format suitability before generating a normal question;
- fail safely to another format when no compatible item exists;
- test every content/format combination that production may schedule.

### Medium — teaching is shallower than assessment breadth

Each concept begins with one rule, one example, and a vocabulary list. That is a sound introduction, but later concepts can assess several sub-patterns across 40 attempts. The audit must map every assessed distinction back to explicit teaching and useful corrective feedback rather than assuming it was learned elsewhere.

## Recommended delivery order within DAB-88

1. **Proof safety and fair mastery — implemented for review:** prevent proof exhaustion; use the approved 19/20 and 9/10-per-direction mastery rule; create targeted follow-up for the missed item; keep retention at 10/10.
2. **Practice breadth:** define minimum effective context diversity and expand the ten-item practice pools.
3. **Ambiguity and alternatives:** repair A1.8 and audit prompts with multiple natural Dutch answers.
4. **Format enforcement:** make `suitableKinds` an actual scheduling constraint with safe fallback.
5. **Teaching coverage:** map assessed sub-patterns to teaching examples and corrective explanations.

## First bounded implementation slice

The first code slice should address proof safety and mastery fairness together because both govern the same high-stakes transition:

- mastery passes with at least 19/20 grammar-correct and at least 9/10 in each direction;
- retention remains 10/10;
- a 19/20 pass records the missed item for targeted later practice;
- a failed mastery can always reach a fresh retry after remediation;
- tests cover 20/20, 19/20 in either direction, an invalid 18/20, an invalid direction imbalance, and fail → remediate → retry → retention;
- no existing learner history is rewritten.

Automated coverage includes a perfect pass through the existing progression suite, 19/20 with the miss in either direction, 18/20 failure, strict 9/10 retention failure, proof-pool uniqueness, offline inclusion, and fail → remediate → retry → retention. Owner review and phone acceptance remain required before promotion or production deployment.

## Practice breadth slice — 27 September 2026

A1.7 negation practice has been expanded from 10 to 20 unique Dutch sentences and English meanings. The pool now covers at least ten verbs and ten subjects, with adjective, adverb, place/time and definite-object negation. New examples cover food, home, travel and everyday actions. The initial bounded acceptance floor is 20 unique sentence/meaning pairs, ten verbs and ten subjects; this is a content-review floor, not a change to progression requirements or a guarantee of transfer. Later pools still require individual review.

Existing sentence identities, teaching, proof records, mastery/retention rules and learner history remain unchanged. Every added sentence is checked against all registered proof text to avoid reducing unseen proof capacity. The scan also found an existing cross-course overlap for A1.7-p-03; broader legacy overlap remains audit work.

Focused checks cover context breadth, proof separation, valid verb metadata, all eight declared formats, word-bank construction, answer options and rejection of omitted negation. The existing A1.7/A1.8 mastery-to-retention progression tests remain in scope.

Phone acceptance remains outstanding: inspect new items in typed, choice, word-bank, gap/form and correction presentations; confirm readable feedback and reachable Check Answer. No UI or service changes are included. This branch is not a release; production cache/version remain unchanged. Rollback is a revert of the additive content slice.

Validation: focused tests passed (4/4); full regression suite passed (394/394); whitespace validation passed. No real-device validation, merge or deployment was performed.

## A1.8 question-word practice breadth — 27 September 2026

The second local practice-breadth slice expands A1.8 from 10 to 20 unique Dutch sentences and English meanings. Each of waar, wat, wanneer, hoe and wie now has four contexts. The pool meets the same minimum of ten verbs and ten subjects as A1.7. Added contexts cover locating everyday belongings, food, family, opening times, lessons, travel, payment and helping. New English prompts avoid singular/plural “you”; the existing A1.8 ambiguity remains a separate audit task.

All ten added Dutch sentences are distinct from every other registered sentence, including proof records. Existing sentence identities, metadata, teaching, proof material, scheduler and mastery/retention rules are unchanged. The original A1.7 breadth slice is retained on this branch. No learner-data, schema, authentication, service or cost changes are included. Production version/cache remain unchanged; no merge or deployment was performed.

Focused checks cover all five question words, diversity, vocabulary-target and verb metadata, all eight declared formats, word-bank construction, unique answer options, distractor rejection, capitalisation tolerance, missing question words and changed word order. Existing A1.7/A1.8 progression coverage also passes. A one-off comparison against the parent checkpoint confirms every original pack record and teaching definition is unchanged.

Phone/PWA acceptance remains outstanding: inspect the new items and feedback in typed, choice, word-bank, gap/form and correction views, confirm Check Answer remains reachable, and check playback through the existing listening path. No audio-service or UI changes are included. Rollback is a revert of the additive A1.8 content commit. Next implementation work is A1.9 practice breadth; ambiguity, format enforcement and teaching coverage follow the breadth audit.

Validation: focused tests passed (7/7); full regression suite passed (397/397); whitespace validation passed. No real-device validation was performed.

## A1.9 perfect tense with zijn practice breadth — 27 September 2026

The third local breadth slice expands A1.9 from 10 to 20 unique Dutch sentences and English meanings, spanning 16 subjects. The six already-taught verb families remain unchanged: gaan and blijven have four contexts each; komen, worden, vertrekken and aankomen have three each. The breadth floor for this concept covers all six already-taught verbs. Added contexts cover visiting family, everyday destinations, staying in a hotel, waking up, illness, departure after breakfast and arrival at a station. New English prompts avoid singular/plural “you”.

Every added Dutch sentence is distinct from all other registered course text, including proof material. A comparison against the parent checkpoint confirms all existing pack records and teaching definitions are unchanged, including A1.10. Auxiliary and final-participle slots are explicitly validated, alongside construction and scoring in all eight declared formats, answer-option uniqueness, distractor rejection, capitalisation tolerance, missing tense components, incorrect auxiliaries and word order. Existing progression and offline-inclusion tests remain in scope.

Learner history, daily scheduling, mastery/retention, services, schema, authentication and production version/cache are unchanged. There is no additional service cost. Earlier A1.7/A1.8 breadth checkpoints remain on this branch. No merge, deployment or real-device validation was performed. Phone/PWA acceptance remains outstanding: inspect new items and corrective feedback in typed, choice, word-bank, gap/form and correction views; confirm Check Answer remains reachable and check the existing listening path. Rollback is a revert of this additive A1.9 commit.

Next implementation work is A1.10 separable-verb practice breadth, followed by later small pools, ambiguity, format enforcement and teaching coverage.

Validation: focused tests passed (7/7); the full regression suite passed (401/401); original-record comparison and whitespace validation passed.
