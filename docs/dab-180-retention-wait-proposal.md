# DAB-180 — useful study during the retention wait

Status: phone-accepted V5.1.164 release candidate. Production verification is recorded after deployment.

## Current behaviour

A passed 20-question mastery test sets `retentionDue` three calendar days later. The topic remains the active topic until its 10-question retention test passes. Its successor requires `masteredAt`, so the learner can only repeat the waiting topic's practice within normal Learning. Retained earlier topics may enter the normal maintenance queue when due. A retention failure returns the topic to practice, without marking it retained. The normal Learning limit is 20 questions per study day.

## Owner decision, 2026-10-02

The owner approved a mastery pass unlocking the next topic's lesson and practice during the wait, while the previous topic remains visibly unretained and its due retention test takes priority. The candidate limits this to one successor: the next topic's mastery proof waits for its prerequisite's retention pass, so uncertified topics do not accumulate. A failed retention proof pauses new-topic progression and returns the previous topic to remedial practice and its existing retake route; any next-topic practice already recorded is preserved.

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

The development candidate has automated coverage for those paths, including a real failed 10-question retention proof, unchanged 20/day limit, older retained-topic maintenance, and offline and remote resume. The production source remains V5.1.163. Phone review and release approval remain open.
