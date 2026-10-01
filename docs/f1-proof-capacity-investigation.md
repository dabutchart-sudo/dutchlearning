# F1 proof-capacity investigation — 2026-10-01

## Reported symptom

The owner saw “Not enough unseen test sentences remain for this topic. You can keep practising meanwhile.” in the first normal F1 Learning question on production V5.1.160. The V5.1.159 test-choice button had appeared inert because session errors were hidden; V5.1.160 checks capacity before offering the test.

## Source-backed findings

- The registered F1 content has 110 distinct proof sentences. All support both written proof directions. Its 148 current practice sentences do not overlap those proof sentences.
- `dailyProofOffer` emits the reported message only when the ready topic has fewer than the required unseen compatible proof sentences. Mastery needs 20; retention needs 10. F1 has no learner-specific vocabulary gate.
- `availableProofCount` excludes sentence wording recorded in the learner's exposure ledger. `prepareQuestion` records a proof sentence when it is shown. V4 migration also carries earlier sentence exposures forward.
- A fresh F1 state with 40 recorded practice answers can start a 20-question mastery test. A deterministic simulation of five failed 20-question mastery tests leaves 10 of the 110 proof sentences unused and reproduces the exact reported message on the next study day.
- Ordinary practice uses a separate pool, so it cannot restore unseen proof capacity. The “keep practising meanwhile” wording is misleading as a recovery instruction.

## Export-backed finding

The owner provided a production V5.1.160 Settings export. Read-only comparison against the registered F1 pool found **110 of 110 unique proof sentences seen; zero remain**. The F1 record contains five completed 20-question mastery tests (four unsuccessful, then one passed) and one unsuccessful 10-question retention test. All 110 seen proof sentences have matching scored test attempts. The export has no V4 migration marker and no active proof. The exposure ledger contains two rows per shown proof question because `prepareQuestion` records both `expose(...)` and a question exposure; the capacity check uses unique wording, so those duplicate rows do not explain the block. The user's saved history appears internally consistent. Do not clear or rewrite it.

After the failed retention test, eight successful practice answers return F1 to `proof-ready` under the current policy. That requires another full 20-question mastery test before delayed retention, and the existing pool has no unused sentences for either. The V5.1.160 warning is therefore accurate about capacity, but “keep practising meanwhile” cannot unblock the test.

At least 30 new unseen sentences are needed for one mastery attempt plus later retention; 50 would also allow one more failed mastery attempt. There are 54 unused short subject-and-verb combinations using verbs already present in F1 content, with no collision against current course text. The export shows that seven of those nine verbs have not appeared in this learner's completed F1 practice, so adding the combinations directly as proof would be unfair. The recovery needs teaching and vocabulary checks as well as more sentence rows.

## Recovery decision needed after the count

Add enough curated, versioned, distinct F1 proof material for a full 20-question mastery test and a later 10-question retention test, with further failed-attempt capacity considered. Preserve the 20/day and current proof standards. Audit Dutch wording, English meaning, suitable formats, cross-pool novelty, and phone/offline delivery before a release. A shorter retest or recycling seen sentences would change the approved proof standard and needs an explicit owner decision.

Current production stays V5.1.160. No runtime, learner-data, schema, sync or service change is included in this investigation.

Tracked as [DAB-184](https://linear.app/dabutchart/issue/DAB-184/restore-f1-mastery-after-unseen-test-pool-is-exhausted).
