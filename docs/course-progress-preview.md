# Course & Progress — review preview

Local branch: `feature/course-progress-preview`, based on main `5cf5422` (Zin V5.1.118).
Related work: #31 (understandable course progression) and #17 (sustained Foundation milestones). This preview is a focused follow-on; no GitHub issue status or production release has been changed.

## Scope

- Course now contains **Your progress** and **Syllabus**, plus browsable topic details.
- The syllabus uses the registered curriculum (26 available topics), shows the current topic and retention status, and explains the exact next step using existing eligibility rules. Locked topics can be inspected without unlocking lessons or exposing proof questions.
- A1.21–A1.26 come from the existing completion roadmap and remain explicitly planned. A2 is future material. Planned material is excluded from available-topic completion counts.
- Read-only charts show grammar/spelling by study day, with date and topic filters. Failed independent typed attempts remain in the independent denominator. Supported/recognition exercises and word-help answers are separate. Missing assessments and quiet days are not fabricated zeroes. Incomplete historical metadata is disclosed and excluded from evidence groups.
- Comparisons require two sets of 20 selected attempts and at least 10 assessed grammar answers in each. Chart counts and a daily table expose the evidence; changing topic difficulty is explicitly acknowledged.
- Missing-form exercises accept a word or the full sentence, check every supplied word, and reconstruct feedback correctly. Full-sentence gap answers do not earn independent-production credit. Existing gap word-error attribution and capitalization separation are retained.

## Files

- `src/engine/course-progress.js`: read-only summaries, course states and planned-topic display metadata.
- `src/ui/course-overview.js` and `.css`: dashboard, chart, syllabus and topic details.
- `src/ui/app.js`: Course navigation, Today shortcut and gap input guidance.
- `src/ui/course-progress-refinements.js`: keep the existing Today decoration from modifying the new Course screen.
- `src/engine/scoring.js` and `exercises.js`: gap full-sentence scoring/feedback.
- `index.html` and `sw.js`: stylesheet and offline assets, preview cache identifier.
- `tests/course-overview.test.js`: regression coverage.
- `preview/`: local-only synthetic scenarios; no external account connections or service workers.

## Review it

Run `python3 preview/serve.py` from the repository, then visit:

http://127.0.0.1:19085/preview/course-progress.html

The preview contains synthetic learner history, labelled visibly. Its selector includes growing progress, fresh start, retention ready, all available topics retained, and the reported `Zij studeert` gap example. The preview refuses to replace unmarked learner data on its origin. Its server blocks external connections and service workers; Flashcards, Report and Words are deliberately disconnected in this local fixture. The production entry point retains those integrations.

The changes are implemented in the actual application modules, not just a visual mockup. No storage schema, scheduling model, flashcard behaviour, authentication, production learner data or historical attempts are changed. The approved release is V5.1.119 with a fresh production cache identifier. The local sample fixture remains available for repeatable review.

## Validation

Baseline: 262 tests passed. Focused tests cover course availability, proof/retention gates and daily budget, all-registered-content rendering, insufficient/unknown evidence, period/topic filters, duplicate IDs, accessible chart data, locked-topic inspection, safe examples, and the missing-form regression. Final suite result is recorded in DEVELOPMENT.md.

Browser checks at desktop and 390×844 covered navigation, the current-topic marker, a locked A1.20 topic, independent versus supported evidence, fresh and completed-course states, retention eligibility messaging, and the exact `Zij studeert` reproduction. The full-sentence answer shows grammar and spelling correct; the primary action remains visible on the phone layout.

## Release review and remaining device checks

- Owner accepted the layout and wording, particularly Syllabus, and authorized release.
- Real-history/device verification, especially sparse early history and iPhone readability. Preview data is synthetic, not a claim about the owner's learning.
- Physical PWA update/offline verification. The local review fixture intentionally disables service workers; asset references are tested separately.
- Release version: V5.1.119. Automated release suite: 279 passing tests, including simulated worker installation, offline Course asset retrieval and scoped cache cleanup. Publication status is recorded in the PR and task report.
