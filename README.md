# Zin

Zin is a personal Dutch-learning PWA focused on sentence construction, adaptive practice, active recall, flashcards and long-term retention.

## Current checkpoint

**V5.1.104**

The current learning path supports sustained Foundation progression rather than a single isolated session:

- finite 20-question daily learning sessions;
- explicit teaching before newly unlocked concepts;
- practice progression through recognition, construction and independent Dutch production;
- clear progress toward the 40-practice mastery threshold;
- 20-question mastery proof using unseen material;
- a three-day retention interval followed by a 10-question retention proof;
- clean handoff into the next unlocked concept and its lesson;
- Today and Course both explain the learner's current milestone rather than exposing raw engine state only;
- Flashcard Listen excludes part-of-word labels such as "verb" from spoken Dutch.

The real Foundation content pack is covered by regression tests across the F1 mastery/retention boundary and the F2 teaching handoff.

## Product direction

Zin is for one learner and is intended to build usable Dutch rather than vocabulary recognition alone. Sentence formation, grammar, spelling, comprehension and production are first-class learning goals. Repeated difficulty should trigger useful support or reduced exposure rather than endless repetition of the same failed prompt.

The Flashcards system remains integrated alongside the structured Learning course. Daily new-card limits are hard ceilings, due reviews take priority, and a completed Flashcard session does not refill unused new-card capacity later the same day.

## Development

Run the regression suite with:

```bash
npm test
```

Current learner-facing development is on `feature/a1-learning-session-vertical-slice`. Mobile-first testing remains part of each milestone.
