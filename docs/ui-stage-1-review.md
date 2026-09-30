# UI Stage 1 review — V5.1.152 local candidate

Owner status: Stage 1 interface accepted on 2026-09-30. Release has not been authorised or performed.

## What changed

- The shared shell uses a compact header, bottom icon navigation, a warmer palette, and the version on every screen, including active Learning questions.
- A persistent sync button opens Learning and Flashcards details. “Learning synced” appears only after the Learning sync routine succeeds. Flashcards reports its own connection, saving, saved, offline, and error states from the integrated Flashcards route.
- The Settings backup text now describes signed-in Learning sync and the live Flashcards collection accurately.
- A new offline cache includes the shell assets and is versioned V5.1.152.

## Course refinement after owner feedback

- The header sync control is now a 44-pixel refresh icon. Green requires confirmed Learning sync and a connected or saved Flashcards state; red signals an error or offline state. Checking and device-only states use blue or amber. Tap the icon for separate details.
- The header shows “Learning to do/complete” and “Flashcards to do/complete” for the current day instead of counts or “ready” text. A prior day’s saved Learning count cannot mark today complete.
- The separate Optional Practice · Listening card and the duplicate “You’re here — [topic]” line are removed from Course. The current topic is still marked in the timeline. The normal daily listening question and the optional activity’s underlying code remain intact.
- The two completion labels now sit in a small stack beside the sync icon. The visible Course intro heading and helper line are removed, while a screen-reader heading remains for navigation.
- Starting a Flashcard batch opens its first card directly. The generic confirmation and the flagged-word warning are removed; flagged sentences remain available in Sentence Review. Queue construction, completion checks, daily new-card limits, and write recovery remain active.

## Preserved behaviour

Course remains home. The 20-question day, proof and retention gates, card scheduling and five-new-card ceiling, persistence format, Supabase schema, authentication, service functions, and standalone Flashcards fallback are unchanged. No production data or deployment was changed.

## Checks

- Focused shell, mobile layout, and study-origin tests pass.
- The complete automated suite passes: 427 tests, 0 failures (`npm test`). The removed warning module accounted for five obsolete tests; one direct-start regression check was added.
- A 390 × 844 static shell preview shows the header, status, and four bottom destinations without horizontal clipping. This preview uses illustrative course content and sync status.
- The refined Course preview at `../ui-proposal/stage1-course-refined-v2.png` shows the smaller one-row header and reduced Course intro at phone size. Its topic names and progress are illustrative.
- A 320-pixel narrow-phone preview also keeps the labels beside the sync icon without horizontal clipping.
- Real iPhone, installed PWA, MacBook, and cross-device sync checks remain for owner review before release. The local headless browser did not finish loading the full app because a module fetch failed in that preview environment; the static shell preview does not substitute for a live device check.

## Release boundary

Keep V5.1.151 on GitHub Pages until release is explicitly authorised. The V5.1.151 source and standalone Flashcards app remain the rollback paths. No new service or running cost is introduced.
