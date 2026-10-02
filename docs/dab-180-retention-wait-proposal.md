# DAB-180 — useful study during the retention wait

Status: design proposal; no production behaviour changed.

## Current behaviour

A passed 20-question mastery test sets `retentionDue` three calendar days later. The topic remains the active topic until its 10-question retention test passes. Its successor requires `masteredAt`, so the learner can only repeat the waiting topic's practice within normal Learning. Retained earlier topics may enter the normal maintenance queue when due. A retention failure returns the topic to practice, without marking it retained. The normal Learning limit is 20 questions per study day.

## Product decision needed

Should a mastery pass unlock the next topic's lesson and practice during the wait? Recommended: yes, for one successor only. A mastery pass demonstrates enough independent command to begin learning the next topic, while the previous topic remains visibly unretained. The due retention proof must be offered before ordinary practice when ten daily questions are available. The next topic's mastery proof should wait until its prerequisite's retention passes, so the learner does not accumulate uncertified topics. A failed retention proof pauses new-topic progression and returns the previous topic to remedial practice and its existing retake route; any next-topic practice already recorded is preserved.

Conservative alternative: keep the successor locked until retention passes. Waiting days should explicitly offer current-topic practice and due maintenance of older retained topics. This preserves the existing certification gate but cannot provide new-topic study during a first topic's wait.

## Proposed safeguards for an approved early unlock

- Keep the three-calendar-day retention delay, 20-question daily limit, 20-question mastery, 10-question retention, and current pass thresholds.
- Give a due retention proof priority across topics, including after the successor has started. If fewer than ten questions remain, explain that it can start on the next study day; do not silently count practice as retention.
- Resume an unfinished proof or question without replacing it. An unanswered practice question may be set aside only through the existing explicit test-start path.
- Treat `retentionDue`, proof history, attempts, and `masteredAt` as existing source data. Derive the new path from them so old local and synced states require no migration or schema change.
- Preserve saved successor practice if the earlier retention test fails; pause progression rather than erase learner work.
- Keep the standalone Flashcards fallback and V5.1.163 production source as rollback.

## Verification before release

Cover the pass day, both waiting days, due day, consumed daily allowance, failed retention, one-topic progression limit, pending question and proof resume, and local/remote state restoration. Run the full test suite, review the phone development build, and obtain separate production release approval.
