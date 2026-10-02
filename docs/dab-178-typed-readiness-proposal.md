# DAB-178 — independent writing before first mastery

**Decision status:** approved by the owner on 2 October 2026. The implementation is a review candidate in PR #139; it has not been released.

## Intended outcome

The first 20-question mastery test opens after both the existing 40-answer practice floor and recent evidence that the learner can write Dutch sentences without help. Recognition, word-bank construction, spelling slips, and an old `proof-ready` label cannot stand in for that evidence. A ready test still takes priority over ordinary practice when all 20 daily questions remain.

## Approved rule

1. Consider only completed, scored attempts for the current concept with `phase: practice`, `kind: typed`, `direction: en-nl`, `assisted: false`, a valid study date, and a Boolean grammar result. A grammar-correct answer counts even if spelling was marked wrong; spelling alone never blocks concept readiness.
2. Look back **14 calendar days**, including today, and use the **latest 12** qualifying attempts in that window. Require **at least 10** qualifying attempts, including **at least two attempts on each of two different study days**. Require grammar accuracy of **at least 80%** of the selected attempts. Failed unaided typed answers remain in the denominator.
3. Apply this gate only before the **first mastery test** for a concept. A recorded mastery attempt remains evidence that the original entry gate was crossed. The existing next-study-day full retake after a failed mastery test, and the route after a failed retention test, remain intact. Completed proof history and retained topics are never reclassified.
4. An older saved `proof-ready` status or an aggregate `independent` count alone is insufficient. If dated, scored, unaided typed attempts are missing or cannot be verified, show what evidence is needed and offer ordinary practice. Do not infer success from a legacy success-only flag, treat a missing help flag as unaided, or rewrite saved attempts.
5. If the gate becomes satisfied with fewer than 20 questions left today, offer the full test on the next study day. Keep the existing 20/day, unseen-question, vocabulary, and retention checks.

## Learner-facing behaviour

- Before ten qualifying attempts: “Keep practising writing Dutch without hints. You have *n* of 10 recent typed answers recorded across *d* study days.”
- With one qualifying day: “Practise independent writing on another study day before the first mastery test.”
- With enough attempts and days but low accuracy: “Your recent independent writing is *correct* of *total*. Reach 80% grammar accuracy before the first mastery test.”
- With unverifiable older history: “Older answers do not show enough detail to verify independent writing. Continue normal practice to build recent evidence.”

These messages belong in Course and test eligibility, not as extra scoring chrome inside a question. They must agree with the start action so an ineligible button cannot appear.

## Why this is a bounded policy

The lookback prevents old success from masking current difficulty. The latest-12 cap lets improvement replace earlier misses without requiring a new lifetime percentage. Ten attempts provide more than a single lucky session, and the two-day rule blocks a one-day burst. First-test-only scope preserves the already-approved retake behaviour. All evidence is derived from existing attempts; no new saved field, schema, migration, or service is required.

## Implementation and acceptance

- Add one pure readiness calculation shared by `dailyProofOffer`, `proofEligibility`, and Course explanation. Keep `masteryPracticeNeed` and current pool/vocabulary checks as separate requirements.
- Preserve unknown help metadata when mapping older synced attempts; only explicit `assisted: false` can count. A saved `proof-ready` label with an unmet new gate must not be displayed as “Test ready.”
- Cover 40 answers with weak writing; 10+ answers on one day; assisted, revealed, recognition and unscored answers; spelling-only slips; recent improvement; expired evidence; older incomplete records; prior mastery failures; failed retention; and daily-budget priority.
- Check a phone-sized Course and Learning flow, and cross-device resume using existing sync data. Do not use the live learner account to fabricate attempts.
- Preserve existing sentence IDs, scoring, proof thresholds, progress, offline cache, and the standalone Flashcards fallback. Rollback removes the new first-test gate without touching learner history.

**Release level:** learning-policy and UI change. The owner approved this rule for implementation. Production release requires separate approval after review and phone validation.
