# DAB-184 F1 proof recovery — V5.1.161 release review

The owner approved the existing written-proof standards and production release of PR #137. The recovery adds eight F1 practice introductions and 152 new proof sentences. Completed practice introduces **nu** before the new proof wording is eligible. Already-seen sentences remain excluded, and no learner history is reset or rewritten.

The owner confirmed a new **nu** sentence on the phone development build. A read-only simulation against the owner-provided export selected a recovery introduction and found sufficient fresh proof material after one completed introduction. A synthetic automated sequence covered three failed 20-question mastery tests, a passing 20-question mastery test, and a later 10-question retention test without reusing any of those 90 test sentences. The export was not committed.

All 452 local tests, both PR #137 checks, and the post-merge main test run passed. GitHub Pages deployed merge commit `d3f722933b9062c27d13bf3f846335d5d52f9911`; the live shell, service worker, F1 recovery content, registry, learner, and proof vocabulary gate match that commit byte for byte. The cache is `dutch-v5.1.161-20261002-f1-proof-recovery`.

The daily 20, 20-question mastery, later 10-question retention, mastery 19/20 with at least 9/10 in each direction, and retention 10/10 are unchanged. There is no data migration, schema, authentication, sync, service, or cost change. Roll back to V5.1.160 source at `847ca2fc30df53ef2795a64a74fdf542731c38b5` if needed; keep saved learner history and the standalone Flashcards fallback.

The remaining acceptance check is on the installed phone: confirm V5.1.161 and Learning synced, then verify the full mastery offer on a study day with all 20 questions available. Do not clear browser data or reset progress.
