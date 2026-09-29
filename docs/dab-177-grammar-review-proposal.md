# DAB-177 — grammar review scheduling proposal

Status: **V5.1.151 released to GitHub Pages**. The owner confirmed the development preview on iPhone and MacBook, and the signed-in production Mac app loaded existing progress after release. Live iPhone sync comparison is pending.

## Current behaviour and constraints

- A successful delayed retention test marks a topic retained and sets `nextMaintenance` seven days later. A grammar-correct maintenance answer usually sets another seven-day interval; a miss enters reinforcement and makes the topic due immediately.
- Normal scheduling considers maintenance about every fifth question, but when every topic is mastered it considers all mastered topics, including those not due. There is no growing interval, per-topic daily limit or explicit review-slot budget.
- A pending question is saved and resumed. Local V5 progress is synchronised as a whole state using revisions; attempts also have a separate merge path. Any new review fields must survive both paths without resetting a higher-revision remote state.
- The normal session remains 20 questions. A ready 20-question mastery proof or 10-question retention proof must be offered before ordinary practice. Flashcard SRS and its five-new-card ceiling remain separate.

## Recommended policy for owner decision

| Decision | Proposed rule | Reason |
| --- | --- | --- |
| Interval ladder | After retention, first grammar review in **3 days**; independent grammar-correct reviews then schedule **7, 14, 30 days**, capped at 30. Due dates use calendar days and remain overdue across missed study days. | Starts soon after retention, then reduces repetition without losing overdue work. |
| What advances the interval | An independent, unassisted **typed Dutch construction** with grammar correct advances one step. A spelling-only slip can advance grammar but still enters spelling follow-up. Listening, recognition, or supported answers do not advance grammar spacing. | Review evidence matches the grammar capability being scheduled. |
| Miss and support | A grammar miss keeps earlier retention evidence, marks the topic as needing reinforcement, resets its interval step to the first rung, and schedules another independent review for the **next study day**. One targeted, easier follow-up may appear within the current daily 20 if room; it counts against review slots but is not a second scheduled review. Repeated misses use existing scaffolding rather than an unlimited loop. | Makes a miss actionable without removing earned history or increasing the day's workload. |
| Daily review share | Set a stable daily budget of `min(6, 1 + floor(retained topics / 4), floor(non-proof allowance / 2))`, where non-proof allowance is 20 minus that day's proof questions. Thus 1–3 retained topics allow one slot, 4–7 allow two, and 20 or more allow at most six. Subtract reviews already answered today from that budget; unused slots are not filled with premature reviews. | More retained topics get more room, while at least half of the non-proof session stays available for current learning. |
| Several topics due | Take the earliest due date first; on ties, prefer reinforcement, then the oldest independent review, then syllabus order. At most one scheduled review per topic per study day; unmet due topics carry forward unchanged. | Deterministic and fair under a large backlog. |
| Proof priority | Offer a ready mastery or retention proof before scheduling any review. A mastery proof uses all 20 slots. After a retention proof, reviews can use only the remaining allowance and the same cap. | Preserves the existing proof-first contract. |

When no due review can be scheduled, ordinary practice continues under the existing 20-question session. This proposal does not redesign the completed-course practice mix.

## Safe state transition

Add one optional per-topic interval-step field to V5 progress, keeping `masteredAt`, proof history, and `nextMaintenance`. For existing retained topics, preserve their saved `nextMaintenance` date and initialise the step conservatively at the first rung when the topic is next reviewed. If the date is absent, treat the topic as due on the next study day; do not rewrite the learner's proof history. Keep the field optional during local/remote load so an older saved state remains valid. No Supabase schema change is proposed.

The implementation isolates the daily budget and due-topic ordering in the scheduler, and updates intervals when maintenance answers are submitted. It retains the current feature's rollback path and standalone Flashcards fallback. No production data rewrite, merge or deployment is part of this slice.

## Validation before release

Automated scenarios: retention → 3/7/14/30-day success ladder; grammar miss and repeated miss; spelling-only slip; supported and non-production answers; many simultaneous due topics; skipped study days; one review per topic per day; pending-question resume; proof-first 20/10 capacity; no daily count above 20; older V5 state and higher-revision remote recovery. Run focused tests and the full suite.

Then inspect a development build on iPhone and MacBook, and verify installed-PWA cache and cross-device synchronisation with genuine but protected learner state before any production release. Rollback should restore the previous scheduler without deleting the additive interval-step field or historical attempts.
