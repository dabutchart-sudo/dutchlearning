# F1 proof-capacity investigation — 2026-10-01

## Reported symptom

The owner saw “Not enough unseen test sentences remain for this topic. You can keep practising meanwhile.” in the first normal F1 Learning question on production V5.1.160. The V5.1.159 test-choice button had appeared inert because session errors were hidden; V5.1.160 checks capacity before offering the test.

## Source-backed findings

- The registered F1 content has 110 distinct proof sentences. All support both written proof directions. Its 148 current practice sentences do not overlap those proof sentences.
- `dailyProofOffer` emits the reported message only when the ready topic has fewer than the required unseen compatible proof sentences. Mastery needs 20; retention needs 10. F1 has no learner-specific vocabulary gate.
- `availableProofCount` excludes sentence wording recorded in the learner's exposure ledger. `prepareQuestion` records a proof sentence when it is shown. V4 migration also carries earlier sentence exposures forward.
- A fresh F1 state with 40 recorded practice answers can start a 20-question mastery test. A deterministic simulation of five failed 20-question mastery tests leaves 10 of the 110 proof sentences unused and reproduces the exact reported message on the next study day.
- Ordinary practice uses a separate pool, so it cannot restore unseen proof capacity. The “keep practising meanwhile” wording is misleading as a recovery instruction.

## What remains unknown

The screenshot does not disclose the owner's exact unseen count, number of prior mastery attempts, or whether V4 migration accounts for some of the marked exposures. Inspect a production **Settings → Export progress** JSON read-only before attributing this to repeated completed tests or a history error. Do not clear or rewrite the learner's history.

## Recovery decision needed after the count

If the ledger accurately records seen proof sentences, add enough curated, versioned, distinct F1 proof material for a full 20-question mastery test and a later 10-question retention test, with further failed-attempt capacity considered. Preserve the 20/day and current proof standards. Audit Dutch wording, English meaning, suitable formats, cross-pool novelty, and phone/offline delivery before a release. If the ledger is inconsistent, demonstrate the inconsistency and design a narrowly scoped, reversible correction for owner review. A shorter retest or recycling seen sentences would change the approved proof standard and needs an explicit owner decision.

Current production stays V5.1.160. No runtime, learner-data, schema, sync or service change is included in this investigation.
