# Dutch Sentence Trainer · V5.1.5

Static, offline-first Dutch practice app hosted with GitHub Pages. Serve this directory with any static HTTP server; no build step or runtime package installation is needed.

## Tests

With Node.js 22 or later, run `npm test` (or `node --test`). GitHub Actions runs the same dependency-free regression suite for pushes and pull requests.

## V5.1.5 refinements

- Correction questions hide roughly half the target word (at least two letters where possible), including its ending. The complete Dutch sentence and English meaning precede specific correction details. Case differences cannot mask the real grammatical difference.
- Sentence-initial word-bank tiles and generated Dutch prompts preserve capitalization. Capitalization is recorded separately from spelling and grammar; proof continues to certify grammar.
- After two independent lexical misses, require a supported encounter before another independent attempt. After three in a study day, exclude the word from spelling-heavy practice for the rest of that day. A later day permits an initial independent attempt; success releases the restriction, while another failure keeps that day's encounters supported. Grammar-only and assisted misses do not saturate words. If all eligible material is blocked, use word-bank construction.
- Hold for word supports pointer and keyboard input. Assistance saves before any reveal; release, cancellation, blur, navigation and hidden documents erase the hint. It remains unavailable during mastery and retention tests.
- Existing V5 local backups and Supabase JSON state remain compatible. New per-word evidence is additive; historical attempts are not retroactively reclassified. The service worker includes both new modules and uses a V5.1.5 cache.

Manual browser checks covered phone-sized question/feedback layout, correction highlighting, sentence-initial tiles, and keyboard assistance. Pointer/touch cancellation and delayed-save races have automated coverage. Live signed-in Supabase synchronization and physical iOS PWA installation require device/account testing; the existing sync conflict strategy is unchanged.
