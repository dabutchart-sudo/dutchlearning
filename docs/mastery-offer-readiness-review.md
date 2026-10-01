# Mastery offer readiness — local review

The saved `proof-ready` state previously controlled the top Course offer and first mastery start. An older or inconsistent state could retain that flag with fewer than the configured 40 practice answers. The UI would then suggest a test despite the documented practice minimum. This is a source-level failure mode; the affected learner's actual count has not been inspected.

The local correction checks the recorded practice count for an initial mastery test in both the offer and the start guard. The Course journey and topic detail show how many answers remain. A prior saved mastery attempt bypasses this initial gate, preserving the next-study-day full retake even for legacy histories. When a test is eligible, Course offers a choice between the full test and continued practice and says that availability does not predict a pass.

Focused tests cover an inconsistent ready flag, reaching the practice minimum, and a prior failed test with an older count. The full suite passes 449 tests. The daily 20, test length, pass thresholds, vocabulary readiness, retention, learner data and sync are unchanged. This is a local candidate; no merge or deployment has occurred. The current V5.1.159 production app and standalone Flashcards fallback remain available.
