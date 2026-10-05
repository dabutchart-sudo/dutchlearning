# DAB-182 — course words in Flashcards: proposal

Status: **approved by the owner on 5 October 2026, with a course share of 3; implemented as a local candidate on a branch.** Not merged, not released, and not checked on a device or against the live deck. No data, schema or deployment has changed.

## Implementation

- `src/engine/course-flashcard-intake.js` holds the rules: headwords, identity matching, eligibility, earliest-taught order, and the share of 3. It also has a switch, `COURSE_INTAKE_ENABLED`.
- `buildFlashcardQueue` accepts an optional priority list and limit inside the same `newLimit`. Without them it behaves exactly as before.
- The Flashcards screen loads the course word list alongside the cards. When a session starts it passes the course priority.
- The dashboard says how many course words are ready and how many can join today. A closed list shows taught words that have no single matching card.
- If a session is restarted, or another device already introduced course cards today, those count against the share of 3. They are identified by `first_seen`.
- The share caps how far course words jump the queue. A course card can still arrive through ordinary card-ID order.
- If the course word list or Learning progress cannot load, Flashcards keep card-ID order.

Tests: `tests/course-flashcard-intake.test.js` and the full suite.

A headless browser run used a fake card collection, with no access to the live deck. It confirmed:
- the dashboard note;
- that taught course words lead the session (*werken* by its card link, *komen* by its Dutch text);
- that no write request was made.

Still needed before release:
- a development preview on iPhone and MacBook against the real collection;
- a check that today's new cards and the shared count are as expected, and that sync and cross-device behaviour are correct. The issue's acceptance requires this.

## The question

Words the course teaches should reach Flashcards, so they are reviewed with spaced repetition. That must happen without:
- exceeding the shared maximum of five new cards per day;
- duplicating a card;
- touching existing card history.

The issue asks the owner to approve three things before any code:
- when a course word becomes eligible;
- how it is matched to an existing card;
- how the one daily ceiling is shared.

## What exists today

- **New-card intake.** The Flashcards batch takes due reviews plus up to the day's new-card allowance. New cards are taken in ascending card-ID order. The allowance is the configured maximum (5). Review-load and retention settings can lower it but never raise it. It is reduced by cards already introduced today, counted from each card's `first_seen` date in Supabase, so the count is shared across devices. It is 0 once the Flashcard day is complete.
- **Course words.** Course sentences carry a vocabulary list:
  - **116** distinct course words link to an existing card by its ID. The course data marks **25** of them as not yet learned when it was built, mostly first taught in F1 and F2. Their live state is in Supabase.
  - About **76** further course headwords, such as *komen*, *waar* or *mogen*, have no card link. Some may match a deck card by their Dutch text.
  - Several hundred further entries are inflected forms or phrases kept for support, such as *gewerkt* or *in het park*. They are not suitable as cards.
- **Taught date.** When a lesson or word help introduces a word, Learning records `taughtAt` for it in the learner's progress. That progress is synced across devices.

## Recommended policy

| Decision | Proposed rule | Why |
| --- | --- | --- |
| **Which words** | Only headwords: words linked to a card, plus single-word course headwords. Inflected forms, phrases and support-only entries never enter Flashcards. | Cards stay one word, one meaning, like the existing deck. |
| **When eligible** | From the **study day after** the word is first taught in Learning (`taughtAt` earlier than today). | Flashcards then reinforce a word the learner has met, rather than introducing it cold on the same day. |
| **Identity** | 1. A course word linked to a card ID is that card.<br>2. Otherwise, it matches an existing card only if exactly one card has the same Dutch text, ignoring capital letters and punctuation. An article must match as written: *de appel* is not *appel*.<br>3. No match, or more than one possible match, means no card. The word is listed for the owner instead. | No duplicates and no guessing. An existing card always wins. |
| **Which cards are affected** | Only matched cards that are still **new** in Supabase. A card already being reviewed keeps its interval, due date, ease and history untouched. | Existing SRS history stays authoritative. |
| **Sharing the ceiling** | The day's allowance is calculated exactly as now. Within it, eligible course cards come first, oldest `taughtAt` first, **up to 3 of the day's new cards**. The remaining slots continue in the existing card-ID order. If fewer course cards are eligible, the deck fills the slots as now. | The total never exceeds 5 and is never refilled after completion. Course words get priority without stopping the existing deck's progress. |
| **After completion** | Unchanged: no new cards once the Flashcard day is complete, from any source. | Required study contract. |
| **New cards for unmatched words** | **Not in this phase.** Creating rows in the `cards` table is a production data write and needs its own approval. Phase 2 can propose it once Phase 1 is proven. | Smallest safe change first. |

The share of 3 is a recommended default. The owner may prefer:
- **course first for all slots:** faster course reinforcement, but the existing deck stalls while course words remain;
- **a smaller share, such as 2.**

## Data and safety

- **No schema change and no new Supabase fields.** Priority is worked out in the app from two sources: the live `cards` rows (whether a card is still new) and the learner's synced Learning progress (`taughtAt`). Nothing new is written.
- **The rating path is unchanged.** A course word introduced through Flashcards is rated, scheduled and recorded exactly like any other new card. As now, its first rating other than Again sets `first_seen` to today, and Again keeps it new and requeues it. The shared daily count therefore stays correct.
- **Cross-device.** Both devices see the same cards and the same synced progress, so they choose the same priority. If one device has not yet loaded Learning progress, it falls back to today's card-ID order. The ceiling is enforced the same way either way.
- **Empty local, populated remote.** Until remote progress is recovered, no course priority applies, and Flashcards behave exactly as today. After recovery, priority resumes. Nothing is lost or reset.
- **Standalone Flashcards app.** Unchanged. It keeps its own order. On a day both are used, cards introduced in either app count toward the shared `first_seen` total that the integrated app reads.
- **Reports.** Retention, activity, mastered cards, rating breakdown, trouble words and interval distribution are unchanged. Optionally, a line can show how many of today's new cards came from the course.
- **Rollback.** One feature switch in the app restores pure card-ID order. No data needs reverting, because no data is written.

## Validation before release

Automated scenarios:
- combined intake never exceeds the allowance, including with load dampening and the retention setting;
- the course share holds;
- no new cards appear after completion;
- a word taught today is not eligible until tomorrow;
- a linked card that is already in review is never changed;
- identity matching covers an ID link, a single text match, no match, an ambiguous match, and an article mismatch;
- cross-device resume after some new cards were introduced on another device;
- an empty local state with populated remote progress;
- the existing Flashcards tests still pass.

Then: a development preview on iPhone and MacBook, and a check against real (protected) learner data that the day's new cards and the shared count are as expected. That comes before any production release.

## Decisions (approved 5 October 2026)

1. Approve eligibility from the study day after a word is first taught, headwords only.
2. Approve the identity rule: ID link, then a single exact Dutch match, otherwise no card.
3. Course words take up to **3** of the five daily new cards.
4. Confirm that creating cards for unmatched course words is left to a later, separate decision.
