# Zin

Zin is a personal, mobile-first Dutch-learning PWA for one learner. Its long-term purpose is to make comfortable everyday Dutch conversation possible through a dependable daily routine, sentence-based learning, spaced review, listening, speaking, interaction, and honest evidence of progress.

## Current production position

Production is Zin V5.1.180 on GitHub Pages:

- Course is the home screen and shows the syllabus, current position, and an explanation of each topic’s learning state.
- Progress shows separate recorded evidence for recall, construction, reading, listening, writing, speaking, and interaction.
- The app shell keeps Course, Flashcards, Progress, and Settings in a four-icon bottom bar, with visible sync status and version.
- Course puts the current topic and next action first; Learning keeps its answer action above the bottom bar and shows detailed evidence on demand.
- Course shows when mastery and retention can next be taken, or what still needs to happen before a date can be given.
- After mastery passes, the next topic’s lesson and practice can begin during the three-day retention wait. A due retention test takes priority; the new topic’s mastery test waits for the earlier retention pass.
- The normal Learning session is finite: 20 questions per study day.
- New concepts are taught before they are assessed.
- Lessons include focused pattern notes and contrasting examples; practice guidance fades and records assisted use.
- Course shows a read-only recap after the normal daily 20.
- Practice progresses from recognition and supported construction toward independent English-to-Dutch production.
- Mastery uses a 20-question unseen proof; retention uses a later 10-question proof. A failed mastery result explains missed patterns and offers targeted practice before a full next-day retake. The first test requires 40 practice answers plus recent unaided Dutch writing evidence, and a test-start error appears beside the action.
- F1 has additional unseen written-proof capacity, introduced through practice before new test wording becomes eligible.
- A1.7–A1.21 tests wait until completed practice has introduced enough vocabulary for the unseen proof and its retention reserve.
- A1.7–A1.21 have at least 90 distinct, practised proof sentences per topic, enough for three failed mastery attempts, a fresh pass and later retention.
- The daily session includes one hidden-text listening beat.
- A taught topic can offer an optional listening round: hear a hidden Dutch sentence and choose which written line it was. It does not use the daily 20 or change saved progress. If audio fails, the same item becomes a visible-text meaning choice.
- Speaking can add one skippable spoken beat when enabled; skipping converts the same item to typing without adding work.
- A taught topic can offer optional speaking practice: say the Dutch for an English sentence. It does not use the daily 20 or change saved progress. If speech cannot be transcribed, the same item becomes typing, which is writing practice.
- Some taught topics offer optional missing-word listening: hear a hidden Dutch sentence, then choose the word that fills the gap. It does not use the daily 20 or change saved progress. If audio fails, the item becomes a reading question.
- Every taught topic offers optional short dictation: hear a short hidden Dutch sentence and type it. Typing is listening and writing practice, not speaking evidence. It does not use the daily 20 or change saved progress.
- From A1.2, topics that teach questions offer optional two-line exchange listening: hear a question and its reply, then choose what was said. It is listening only, not conversation evidence, and it does not use the daily 20.
- Sentence discrimination, missing-word and dictation listening offer an optional slower replay. An answer given after it counts as supported listening.
- Words taught in Learning that match an existing Flashcard can take up to 3 of the day's 5 new cards, from the next study day. Nothing is created and card history is unchanged.
- Integrated Flashcards provide a separate batch with Again / Hard / Good / Easy ratings and retention reporting.
- On phones, the four Flashcards summary figures share one row.
- The configured new-card limit is a hard ceiling; the current required maximum is 5 per day.
- Retained grammar review follows a 3/7/14/30-day interval ladder within the existing 20-question daily session.
- Supabase preserves signed-in learner state, and GitHub Pages is the only normal production study origin.

Completing the current A1 syllabus is an important stage, not the final destination and not an official CEFR qualification.

## Agreed product direction

Zin will evolve incrementally from a strong structured course and flashcard system into the learner's primary method for conversational Dutch.

Development is organised around three connected tracks:

1. **Conversational capability** — deeper listening, conversational chunks, real-life scenarios, assessed speech, controlled dialogue, then less constrained conversation.
2. **Question quality** — a small, consistent family of question formats with explicit teaching/assessment intent, fair support, useful feedback, and reliable evidence.
3. **Progress clarity** — separate views of course position, capability, and retention rather than a misleading single completion percentage.

The active staged roadmap is:

1. Baseline, feature flags, question-format catalogue, and evidence model.
2. Question-format consolidation and teaching-quality audit.
3. Course journey, capability profile, and retention/activity reporting.
4. Listening progression from hidden-text sentences to short exchanges.
5. Conversational chunks and scenario-based objectives.
6. Assessed spoken answers with typed fallback.
7. Controlled dialogues.
8. Broader, less predictable listening and conversation.

New formats move through **Experimental → Practice → Trial → Core**. Experimental work must not destabilise the normal daily session.

## Non-negotiable safeguards

- Keep the live daily study route usable throughout development.
- Preserve learner history, card identities, scheduling, review history, and Supabase recovery behaviour.
- Keep the 20-question daily close and the hard 5-new-card ceiling.
- Keep Flashcards and Learning as distinct, satisfying activities.
- Do not let spelling alone block grammar/concept progression.
- Repeated failure triggers scaffolding or reduced exposure, not endless repetition.
- Keep normal questions single-screen, mobile-first, and easy to use on iPhone and MacBook.
- Keep Check Answer pinned/easy to reach and use hold-to-show where revealing an answer could encourage copying.
- Do not add points, streak pressure, leagues, badges, or other gamification.
- Keep provider credentials server-side. Never expose an OpenAI key in the browser or PWA.
- Keep at least one reliable fallback study path until a replacement is explicitly accepted.

See [DESIGN.md](DESIGN.md) for intended learning behaviour, [DEVELOPMENT.md](DEVELOPMENT.md) for current delivery state and roadmap, and [AGENTS.md](AGENTS.md) for change-control rules.

## Development

Run the regression suite with:

```bash
npm test
```

Substantial work uses focused branches and pull requests. Documentation-only changes must not be presented as implemented application behaviour. Mobile/PWA and real-device verification remain required where relevant.
