# V5.1.92 integration checkpoint

V5.1.92 is the stabilisation checkpoint for the integrated Flashcards work inside Dutch Learning.

## What is now implemented

- Live Flashcards destination backed by the existing Supabase `cards` and `reviewhistory` data.
- Again / Hard / Good / Easy scheduling and review-history writes.
- Hard configurable daily new-card ceiling, currently 5.
- Review-load dampening may reduce new cards but never raises the configured ceiling.
- Persisted done-for-today behaviour so unused new-card capacity is not offered after the normal daily batch is completed.
- Flashcard dashboard with live due/new counts, retention and progress information.
- English → Dutch production bridge with supported and guided practice separated from SRS scheduling.
- Contextual sentence-bank infrastructure and authenticated AI sentence generation.
- Sentence-maintenance workflow:
  - flag a card during review;
  - persist shared sentence flags in Supabase;
  - prepare five AI sentence alternatives for every flagged word before review begins;
  - choose a replacement, regenerate, edit manually or remove the flag;
  - sentence maintenance does not change SRS scheduling.
- Shared `sentence_flagged` state so flags can ultimately be seen across devices/builds rather than living only in one browser's local storage.

## V5.1.92 defect fix

The sentence-maintenance screen was correctly rendering all flagged cards, but the separate Flashcards dashboard organiser treated that screen as the dashboard and moved every card after the first two into its hidden Progress & details area. V5.1.92 scopes dashboard-only behaviour to the actual dashboard, so the full sentence-maintenance batch remains visible.

## What remains before Flashcards is considered production-stable

1. Complete one normal integrated Flashcard batch on a physical phone/PWA.
2. Verify Again / Hard / Good / Easy changes persist after closing and reopening.
3. Verify a day with review pressure and fewer than 5 new cards does not offer the unused allowance after completion.
4. Verify the next study day opens normally again.
5. Verify sentence flags and chosen sentence replacements persist through Supabase and appear correctly after reopen.
6. Confirm the integrated dashboard and review layouts are usable on the normal phone form factor.
7. Record any defects separately rather than continuing to enlarge this checkpoint.

The standalone Flashcards app remains the fallback until the checks above pass. It should not yet be retired.

## Development boundary after this checkpoint

Do not continue adding unrelated learning features to `feature/unified-flashcards-phase-1`.

Once the verification checklist is satisfactory, begin the main learning-side work as a fresh bounded milestone. The next milestone should deliver one complete learner-visible session loop rather than a collection of isolated widgets:

`start → teach/review → recognise → construct → produce → feedback/support → finish → persist`

Use a small amount of real A1 content first. Expand content and exercise variety only after that complete loop is usable and testable.
