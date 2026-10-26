# F2 retention recovery — development review

## Scope and baseline

Owner-approved content recovery and explanatory UI only. Isolated `codex/f2-retention-recovery` starts at V5.1.195 `26272d5` and is rebased onto refreshed `origin/main` `a54413d`, including the subsequently merged development gallery. A live-page read confirms V5.1.195. The question-gallery checkout and its uncommitted work remain untouched. This is a local candidate, with no merge or deployment. [DAB-207](https://linear.app/dabutchart/issue/DAB-207/add-an-f2-proof-reserve-and-explain-delayed-retention-priority) records generic scope and acceptance without personal learning results.

## Behaviour

- Add 108 unique F2 written proof sentences and four practice introductions. Fourteen existing object contexts × eight existing subjects provide 112 rows. `nu` follows the finite verb; English uses the corresponding present progressive with “now”. Existing finite-verb metadata, object articles and subject agreement come from the original rows.
- Every new proof word must have appeared in completed practice. The existing F1 recovery mechanism also handles F2, favours vocabulary introductions only when the original reserve is low, and reserves 30 questions for a mastery attempt plus delayed retention. Original F2 proof rows keep their eligibility; IDs and wording are not changed.
- Keep the existing 20-question mastery, 19/20 overall and 9/10 each direction, delayed 10/10 retention, remedial recovery, unseen wording, 20-question daily limit, and earlier-retention priority.
- Explain why an earlier due retention check comes before later practice, preserve and name the later topic’s practice count, and explain that passing allows continuation within the remaining daily allowance. Hide the explanation before the due date and after daily completion. A blocked offer displays its existing reason.

## Validation

- `node --test tests/f2-proof-recovery.test.js tests/f1-proof-recovery.test.js tests/course-overview.test.js`: 24/24 passed.
- `npm test` after reconciliation with `a54413d`: 625/625 passed.
- `npm run audit:proof`: passed; existing A1.7–A1.21 effective reserve remains at least 90 per topic.
- New tests cover distinct content, written formats and scoring, original eligibility, unfamiliar-word exclusion, successful retention and unchanged later progress, failed retention → eight recovery answers → full mastery → delayed retention without reused proof wording, and read-only Course/topic copy with waiting, blocked and completed-day states.
- A private in-memory simulation against saved state confirms an eligible retention offer, a successful ten-question check, unchanged later progress and return to the later topic. Actual answers and state are not committed; no database writes occurred.
- Synthetic browser rendering at 390×844 and 1280×800: Course and topic explanation present, no horizontal overflow, Course action reachable. Phone screenshots visually inspected. This is not installed-device validation and did not exercise live audio, sign-in or sync.

## Course capacity audit

A read-only scan across all 36 topics counted unique proof wording after excluding the topic’s practice wording and all earlier-topic wording. F2 now has 218 usable distinct rows before personal vocabulary filtering (110 original + 108 new); its new reserve alone supports multiple recovery cycles. F1 has 262 and F3 240. No F2 duplicates or cross-course exposure collisions were found.

The scan also confirms that finite pools elsewhere can still run out: F4/F5 have 80 each, A1.3 has 56, A1.5 has 59, A1.6 has 72, and A1.22–A1.25/S1–S3 have 40 each. Those are structural content counts, not learner-specific remaining capacity or language-quality guarantees. A1.7–A1.21 retain at least 90 effective rows after existing exposure collisions. No unrelated content expansion, new policy or speculative issues were added. No finite reserve guarantees unlimited retakes.

## Before release

1. Review Dutch/English phrasing and ambiguity in `src/content/f2-proof-recovery.js`. No native-speaker acceptance is claimed.
2. Confirm Course’s “Why … today?” wording and test/practice choice on an iPhone preview. Do not use a development origin for a genuine session.
3. Obtain explicit release approval, assign a release version/cache identifier, then validate the installed PWA’s updated version, explanation and retention availability. These steps are outstanding.

## Data, costs and rollback

Changed files: `src/content/f2-proof-recovery.js`, `src/content/registry.js`, `src/engine/proof-vocabulary.js`, `src/ui/course-overview.js`, `sw.js`, `tests/f2-proof-recovery.test.js`, `DEVELOPMENT.md` and this review note. `DESIGN.md` and README are unchanged because intended study rules and the current public product summary are unchanged.

No learner-data rewrite, reset, scoring shortcut, schema/authentication change, sync change, AI request, protected function change or new cost. Proof questions still use deterministic scoring and written formats. The offline list gains the module; offline update/install behaviour awaits the release checks.

Rollback before release: discard or revert the candidate files together (new F2 module, registry import, vocabulary extension, Course explanation, offline asset entry, tests and notes). After release, revert that release while retaining learner history; never clear exposure records. Production study and integrated/standalone Flashcards remain available. If new rows have already been answered, retain the released content definitions during rollback planning so history source IDs remain resolvable.

## Owner-approved release preparation — 26 October 2026

The owner explicitly requested production deployment. V5.1.196 uses cache `dutch-v5.1.196-20261026-f2-retention`. The release changes version references in index.html, package.json and sw.js; no additional runtime scope. The release proceeds on that explicit instruction with installed-iPhone/PWA and independent language acceptance still unconfirmed. Previous production source is `a54413d` (V5.1.195). Merge, CI and live-source evidence will be recorded after verification.
