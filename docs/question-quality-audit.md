# Question-quality audit

Status: initial read-only audit for DAB-88, 23 September 2026.

This audit examines the current production content and scoring architecture. It does not change questions, learner state, scheduling, Supabase data, or production pass rules.

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

A mastery test consumes 20 unseen proof sentences and retention consumes another 10. A1.7–A1.12 contain only 32 proof sentences. A simulated one-question mastery failure in A1.7 leaves 12 unseen sentences; after the required remediation, starting the next 20-question mastery test throws `Not enough unseen proof sentences remain in this pack`.

This is a progression blocker, not merely a content-quality concern. The same structural risk exists anywhere the effective proof pool cannot support failures, a later successful mastery test, and retention.

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

Production currently requires 20/20 grammar: 10/10 Dutch → English and 10/10 English → Dutch. The owner-approved DAB-88 direction is 19/20, with at least 9/10 in each direction. The missed item must still generate targeted follow-up. Spelling and capitalisation remain separate unless they change grammar or meaning. Retention scoring requires a separate explicit decision.

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

1. **Proof safety and fair mastery:** prevent proof exhaustion; implement the approved 19/20 and 9/10-per-direction mastery rule; create targeted follow-up for the missed item; keep retention unchanged pending a decision.
2. **Practice breadth:** define minimum effective context diversity and expand the ten-item practice pools.
3. **Ambiguity and alternatives:** repair A1.8 and audit prompts with multiple natural Dutch answers.
4. **Format enforcement:** make `suitableKinds` an actual scheduling constraint with safe fallback.
5. **Teaching coverage:** map assessed sub-patterns to teaching examples and corrective explanations.

## First bounded implementation slice

The first code slice should address proof safety and mastery fairness together because both govern the same high-stakes transition:

- mastery passes with at least 19/20 grammar-correct and at least 9/10 in each direction;
- retention remains 10/10 until separately approved;
- a 19/20 pass records the missed item for targeted later practice;
- a failed mastery can always reach a fresh retry after remediation;
- tests cover 20/20, 19/20 in either direction, an invalid 18/20, an invalid direction imbalance, and fail → remediate → retry → retention;
- no existing learner history is rewritten.

Owner review and phone acceptance remain required before promotion or production deployment.
