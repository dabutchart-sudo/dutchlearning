# Zin

Zin is a personal, mobile-first Dutch-learning PWA for one learner. Its long-term purpose is to make comfortable everyday Dutch conversation possible through a dependable daily routine, sentence-based learning, spaced review, listening, speaking, interaction, and honest evidence of progress.

## Current production position

Production is Zin V5.1.141 on GitHub Pages:

- Course is the home screen and shows the syllabus and current position.
- The normal Learning session is finite: 20 questions per study day.
- New concepts are taught before they are assessed.
- Practice progresses from recognition and supported construction toward independent English-to-Dutch production.
- Mastery uses a 20-question unseen proof; retention uses a later 10-question proof.
- The daily session includes one hidden-text listening beat.
- Speaking can add one skippable spoken beat when enabled; skipping converts the same item to typing without adding work.
- Integrated Flashcards provide a separate batch with Again / Hard / Good / Easy ratings and retention reporting.
- The configured new-card limit is a hard ceiling; the current required maximum is 5 per day.
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
