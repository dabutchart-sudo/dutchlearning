# Dutch Learning — Product Design

## Purpose

Zin is a personal Dutch-learning application for one learner. Its purpose is to develop durable, usable Dutch through a manageable daily routine, sentence-based learning, spaced review, adaptive support, listening, speaking, interaction, and visible evidence of progress.

The agreed long-term destination is **comfortable everyday conversation**. Zin is intended to become the learner's primary study method for reaching that level. Completing the current A1 syllabus is a necessary stage, not the final destination and not an official CEFR qualification.

Zin is not a commercial, multi-user language platform. Decisions optimise for the owner's learning needs, memory, devices, motivation, and preference for measurable progress without gamification.

## Product principles

- Move from recognition toward independent comprehension and production.
- Teach language before testing it.
- Use meaningful sentences, phrases, and situations rather than isolated words alone.
- Make repetition contextual and useful.
- Respond to repeated failure with help, a simpler step, or reduced immediate exposure rather than an endless loop.
- Keep spelling evidence separate enough that spelling does not trap grammar or communication progress.
- Make the end of each normal study day decisive.
- Show progress only where evidence supports it.
- Preserve a reliable production study route and genuine learner history throughout development.
- Add conversational capability incrementally; do not replace a dependable course with an unbounded chatbot.

## Daily study contract

### One normal Learning session

The app generates one normal Learning session per study day. The normal session contains 20 questions. Completing it completes normal Learning for that day; refreshing or reopening the app must not create another normal session.

Mastery uses a finite 20-question proof and retention uses a later 10-question proof. A ready proof must be offered before ordinary practice when enough of the daily allowance remains.

After a failed mastery proof, a retake becomes eligible on the next study day without a quota of successful remedial questions. It still needs all 20 of that day's questions. Practice remains available in the meantime.

Optional Free Practice, Review Ahead, experimental Practice activities, and future open conversation remain clearly separate. They must not refill daily capacity, silently alter mastery/retention, or leak extra retries into the next normal queue.

### New-card limit and Flashcards

The configured maximum number of new Flashcards is a hard adjustable ceiling. The current required maximum is **5 per day**. Workload logic may introduce fewer, but never more, and unused capacity must not be replenished after the batch is complete.

Due reviews take priority. Flashcards remain a separate, satisfying batch with meaningful retention reporting and Again / Hard / Good / Easy decisions.

### Listening and speaking beats

The normal session may contain a short, finite listening beat and speaking beat drawn from the current topic. They count within the daily 20; they are not extra work.

Speaking remains optional when talking is inconvenient. Skipping converts the same item to its typed equivalent without dropping it, adding another question, or awarding speaking evidence. Mastery and retention proofs remain finite written checks until an explicit later design decision changes that rule.

## Capability model

Zin records distinct evidence rather than treating every correct answer as interchangeable.

| Capability | What it means | Suitable evidence |
| --- | --- | --- |
| Recognise | Understand familiar Dutch | Dutch-to-English meaning selection |
| Recall | Retrieve a word or phrase | English cue to Dutch recall |
| Construct | Build correct Dutch structure | Word order, missing form, controlled construction |
| Produce | Generate Dutch independently | Typed English-to-Dutch sentence |
| Listen | Understand Dutch without reading it first | Hidden-text audio selection, dictation, comprehension |
| Speak | Retrieve and communicate Dutch aloud | Recorded/spoken response, not a typed substitute |
| Interact | Respond appropriately in an exchange | Bounded dialogue with several acceptable responses |
| Retain | Reproduce learning after delay and variation | Unseen delayed proof |

Spelling is supporting evidence, not a universal gate. Help usage must be recorded so supported success is not confused with independent proof.

## Question-format system

Zin uses a small family of consistent question formats. New formats must be justified by the capability they teach or prove; visual novelty is not sufficient.

Every format requires a written contract covering:

1. the capability it teaches or assesses;
2. whether the current use is teaching, guided practice, independent practice, or proof;
3. acceptable answers and ambiguity handling;
4. available support and how support changes the evidence earned;
5. feedback after success, near miss, and failure;
6. repeated-failure behaviour;
7. offline and service-failure behaviour;
8. accessibility and mobile layout;
9. persistence and resumption behaviour;
10. automated and manual validation.

The shared presentation should remain stable:

- one task per screen;
- a clear prompt and one principal answer area;
- pinned or continuously reachable **Check Answer**;
- help available without dominating the screen;
- feedback in a consistent location with enough sentence context to explain the pattern;
- internal status and scoring machinery hidden during normal questions;
- capitalization differences not penalised where meaning and Dutch orthography do not require it;
- multiple-choice English answers preferred to typing English;
- hold-to-show where immediate reveal would encourage copying.

A format must not enter the compulsory daily session merely because it exists.

## Format release ladder

New capabilities move through four levels:

1. **Experimental** — isolated test route; no production progress.
2. **Practice** — optional learner-facing activity; diagnostic evidence only.
3. **Trial** — a small, controlled share of selected daily sessions; limited evidence.
4. **Core** — normal adaptive use after reliability, fairness, and learning value are demonstrated.

Every promotion requires suitable regression coverage, owner acceptance, and relevant mobile/real-device validation. A feature flag or equivalent rollback path must remain until the new path is proven.

If audio, transcription, AI, or another optional service fails, the normal session must substitute or convert the item safely rather than become unusable.

## Conversational-learning roadmap

### Stage 0 — Baseline and safeguards

Document current formats and evidence, establish feature flags/test routes, strengthen daily-session and persistence regression coverage, and preserve recovery paths.

### Stage 1 — Question quality

Consolidate prompt, answer, help, and feedback behaviour. Complete the teaching-quality audit. Separate independent, supported, and revealed success. Prevent spelling from blocking broader learning unfairly.

### Stage 2 — Trustworthy progress

Deliver three complementary views:

- **Course journey** — where the learner is going and the current syllabus position;
- **Capability profile** — what the learner can currently do across vocabulary/recall, grammar/construction, reading, listening, writing/production, speaking, and interaction;
- **Retention and activity** — whether learning is sticking over time.

### Stage 3 — Listening depth

Progress from known sentence audio to hidden-text meaning, sentence discrimination, missing heard words, short dictation, and comprehension of two-line exchanges. Later introduce different voices and controlled speed variation.

### Stage 4 — Conversational chunks and scenarios

Teach reusable units such as *Ik denk dat…*, *Kun je dat herhalen?*, and *Ik zou graag…* as scheduled learning objects. Organise application around real tasks: introductions, home/family, ordering and paying, arranging plans, directions, and explaining a simple problem.

Grammar remains explicit where useful, but each course block should contribute to a communicative objective.

### Stage 5 — Assessed spoken answers

Add a narrow loop: prompt, spoken response, transcription, comparison, focused feedback, retry, and later review. Early assessment prioritises comprehensibility and correct retrieval over native accent imitation.

Typed fallback remains available but earns no speaking evidence.

### Stage 6 — Controlled dialogues

Add short two-to-four-turn exchanges with bounded vocabulary, several acceptable responses, optional phrase support, and clarification/repetition controls. Feedback normally follows the exchange rather than interrupting every utterance.

### Stage 7 — Broader conversation

Only after controlled dialogue is dependable, introduce more phrasing variation, unfamiliar sentences built from known language, longer audio, freer answers, idiomatic feedback, conversational repair, and optional open conversation.

Open conversation remains extra study unless the owner explicitly approves a bounded form for the normal daily session.

## Progress and reporting

A single overall percentage must not imply balanced conversational ability.

### Course journey

Course is home. It shows the finite syllabus, current position, next meaningful objective, and topic states:

- Not started
- Learning
- Practising
- Proven
- Retaining
- Needs attention

The current topic starts or continues the normal daily session. Retained topics may offer clearly labelled extra practice.

### Capability profile

Progress separately represents Vocabulary/Recall, Grammar/Construction, Reading, Listening, Writing/Production, Speaking, and Interaction. A capability rises only from relevant evidence:

- listening requires hidden-text comprehension, not pressing Listen while reading;
- speaking requires a spoken response, not a typed fallback;
- interaction requires an exchange, not an isolated sentence;
- independent proof must not be inferred from revealed answers.

Early empty or low-evidence areas should be shown honestly without framing them as failure.

### Retention and activity

Keep meaningful Flashcard and Learning reporting: New, Learning, Reviewing, Mastered, recent retention, completed study, and areas due for reinforcement. Prefer a few understandable facts and day/month/year trends over dense dashboards.

Progress is not gamification. Do not add points, streak pressure, leagues, badges, chests, rewards, or artificial scarcity.

## Listening, speech, and AI architecture

OpenAI is the approved provider. Audio and transcription use the existing server-side key through authenticated, quota-controlled Supabase Edge Functions or a local preview-server environment. A provider key must never enter browser code, the installed PWA, logs, or repository.

Do not begin with OpenAI Realtime. Scripted and request/response speech paths come first. A later realtime or free-conversation architecture requires a separate owner decision, spend controls, authentication review, fallback behaviour, and production-safe validation.

Generated or AI-evaluated output must not silently determine permanent mastery without deterministic rules, explainable evidence, and a recovery path. AI is most valuable for acceptable-answer breadth, near-miss explanation, feedback, and controlled variation.

## User experience

- Mobile-first, installable/PWA-friendly, usable on iPhone and MacBook, and deliberately iOS-like in clarity.
- Normal questions should fit on one phone screen without unnecessary scrolling.
- Course, Flashcards, Progress, and Settings remain the main destinations.
- Course remains home; there is no separate Today destination.
- Learning `x / 20` and Flashcards ready/done remain easy to see.
- The interface should be welcoming and characterful through colour, path design, and human copy—not game chrome.
- GitHub Pages is the only normal origin for genuine study. Local and `192.168` origins remain visibly marked as Development.

## Data, synchronisation, and production safety

Supabase is the persistent cross-device service for signed-in use. Local/offline behaviour remains robust where supported.

Learner state, card identity, scheduling, review history, authentication boundaries, existing schema, and the empty-local/populated-remote recovery protections are production contracts. Changes require explicit approval, additive/backwards-compatible design where practical, representative testing, rollback, and real-device verification when relevant.

At least one reliable route must remain available for genuine daily study. The standalone Flashcards path is retained as a fallback until explicitly retired.

## Product scope and authority

Evaluate features by asking:

1. Will this improve the owner's conversational Dutch?
2. Will it make daily study clearer, sustainable, or more effective?
3. Does it produce trustworthy evidence rather than decorative progress?
4. Does it preserve learner data and a reliable production route?
5. Is the complexity justified for one learner?

This document is the authority for intended product behaviour. Implementation shortcuts do not silently rewrite it. The owner alone approves changes to product direction, learning policy, provider/platform strategy, architecture, or production data model.
