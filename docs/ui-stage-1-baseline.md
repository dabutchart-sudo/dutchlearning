# UI Stage 1 baseline — 2026-09-30

The UI work starts from production `main` at `c9f4f08` (merge of the V5.1.151 release documentation), not from the earlier local `planning/dab-177-review-scheduling` checkout. That planning checkout has the same application files as the current production branch but older release documentation.

## Verified release identity

- The public GitHub Pages `index.html` title and `package.json` both report V5.1.151.
- The public service worker uses cache `dutch-v5.1.151-20260929-grammar-review` scoped to the app path.
- The public GitHub `main` pointer is `c9f4f08cc0a21d4d9b76148ebe86e0e316eee554`.
- GitHub `main` includes the V5.1.151 scheduling release and its release note, although the README and top-line release label in DEVELOPMENT.md still said V5.1.150 before this correction.

These checks verify the public files returned on 2026-09-30. They do not verify what an already installed PWA has cached on a particular device, nor do they complete the pending live iPhone sync comparison.

## Stage 1 working rules

- Base UI changes on production `main` at or after `c9f4f08`; recheck the branch pointer before implementation.
- Preserve the existing learning, proof, flashcard, storage, and sync contracts. The UI work does not itself change learner data or schema.
- Keep a visible version and truthful sync state on each main screen. A single “synced” indicator must not imply both Learning and Flashcards are current unless each has been verified.
- Keep the current production study path and standalone Flashcards fallback available until the owner accepts a release.

The README and DEVELOPMENT.md release labels are corrected in this documentation-only Stage 1 baseline change. No app code or deployment is changed here.
