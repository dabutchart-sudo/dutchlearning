# DAB-179 failed-mastery recovery — local review

## Decision on focused retests

Keep the current next-study-day full retake. A retest of only missed patterns would not demonstrate 19/20 grammar overall with at least 9/10 in both directions, and would change the written proof contract. No shorter proof or new pass rule is introduced. The full retake still uses 20 fresh sentences within that day's normal 20; retention remains a delayed 10/10 written proof.

## Candidate behaviour

After a failed mastery test, Course opens the latest result and groups grammar misses by direction and error type. Each visible group includes a full Dutch model sentence, its English meaning and a pattern-level explanation. The summary is derived from already saved attempts; no new progress field or data migration is needed. If older history lacks the matching attempts, the score and next-day route remain available without invented feedback.

Up to three distinct missed patterns are queued for normal practice. The practice scheduler uses a different practice sentence from the same topic, preferring the missed verb when a compatible format exists. Dutch-to-English misses use meaning choice. English-to-Dutch misses use typed production after one failure; after two or more failed mastery tests they use a guided word bank. This practice is optional, counts within the ordinary daily 20 and cannot produce independent proof credit. The ready full retake is still offered before practice; choosing practice can defer the 20-question retake to another study day. A new failed proof replaces old recovery targets, and a pass removes them.

The existing proof-vocabulary and unseen-capacity checks remain in place. The current proof pools have measured capacity for three failed full mastery days, a passing day and retention, but repeated failure beyond that capacity may require more reviewed proof content before another test can start. Practice remains available in that case.

## Review and release status

Automated scenarios cover misses in either direction, full-sentence feedback, next-day timing, guided practice after repeated failure, the daily limit, eventual 19/20-or-better mastery and strict retention. The full local suite passes 443 tests.

For a quick phone layout check on the development preview, open Settings → Developer & test controls → Open developer sandbox → Preview failed mastery result. This creates a labelled A1.7 sample with two failed proof days only in the separate sandbox, without requiring 20 manual answers or touching real progress. Check the expanded result card, long Dutch sentences, readable advice and reachable Course actions. Human review should also confirm that the pattern labels and examples are useful Dutch teaching. The owner accepted the phone preview and approved production release on 1 October. The installed iPhone/PWA update check remains open. This is a V5.1.158 release candidate: nothing has been merged or deployed yet, and the current production study route and standalone Flashcards fallback remain available.
