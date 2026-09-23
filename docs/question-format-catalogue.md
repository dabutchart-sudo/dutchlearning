# Question format and evidence catalogue

Status: baseline for DAB-168. This document records current behaviour before the conversational-learning formats are expanded. It is descriptive, not a claim that every format is sufficient for conversational Dutch.

## Shared format contract

Every question format should declare the following before it progresses beyond experimentation:

| Field | Meaning |
| --- | --- |
| `capability` | Primary evidence: Recognise, Recall, Construct, Produce, Listen, Speak, Interact, or Retain |
| `support` | Independent, Supported, or Revealed |
| `releaseLevel` | Experimental, Practice, Trial, or Core |
| `prompt` | What the learner sees or hears |
| `response` | What the learner must do |
| `scoring` | Exact rules for correctness and partial/error feedback |
| `fallback` | Accessible recovery when audio, speech recognition, or another dependency fails |
| `attemptEvidence` | Fields persisted for progress and later analysis |
| `promotionEvidence` | Evidence needed before the format advances a release level |

Release levels have distinct meanings:

- **Experimental:** developer-only; validates mechanics and data shape.
- **Practice:** optional learner-facing activity; does not gate progress.
- **Trial:** included for a bounded audience or bounded schedule position with explicit monitoring.
- **Core:** may affect normal progression after evidence shows it is reliable and educationally useful.

## Structured Learning formats

These are generated in `src/engine/exercises.js`, scheduled by `src/engine/scheduler.js`, scored in `src/engine/scoring.js`, and rendered in `src/ui/app.js`.

| Kind | Current prompt → response | Current progression evidence | Support and fallback | Conversational limitation |
| --- | --- | --- | --- | --- |
| `choice` | Dutch sentence → choose English meaning | Recognised | Independent selection; audio is available through the common prompt control | Measures recognition, not spontaneous language use |
| `correct-sentence` | Meaning/context → choose the correct Dutch sentence | Recognised | Independent selection | Distractor discrimination does not prove recall or production |
| `wordbank` | English meaning → arrange Dutch tiles | Constructed | Help may reveal the answer; distractor tiles are included | Construction is constrained by visible vocabulary and word forms |
| `gap` | Dutch sentence with a missing form → type the missing form or full sentence | Constructed | Typed response; normal practice help is available | Narrow form completion; full-sentence answers are accepted but not independent evidence |
| `form` | Context → choose a verb/form | Constructed | Independent selection | Shared scoring currently categorises wrong answers as translation errors |
| `correction` | Dutch sentence with the end of a form hidden → type missing letters | No dedicated progression counter | Typed response; about half the target is exposed | Primarily spelling/morphology repair, not conversation |
| `typed` | English sentence → type Dutch sentence | Independent only when correct, unassisted, and English→Dutch | Hold-to-show makes the attempt assisted | Strong recall evidence, but no listening, timing, turn-taking, or communicative intent |
| `listening` | Hidden Dutch audio → choose English meaning | Recognised | “Audio unavailable?” converts the same pending item to text `choice` | Listening is collapsed into recognition; fallback provenance is not retained as a separate capability outcome |
| `speaking` | English sentence → say Dutch sentence; browser transcript is scored | Recognised | Can skip the same item to `typed` | String similarity measures transcript match, not pronunciation or comprehensibility; speaking is collapsed into recognition |

Current Structured Learning attempts retain exercise kind, direction, phase, assistance, grammar, spelling, capitalisation, lexical errors, vocabulary and error type. The learner state aggregates `recognised`, `constructed`, and `independent`; it does not yet aggregate the full capability model.

## Flashcard and production formats

Flashcard review is a separate system and must not be interpreted as equivalent to course-question evidence.

| Format/stage | Current learner action | Evidence interpretation |
| --- | --- | --- |
| Flashcard review | Reveal a card and self-rate Again/Hard/Good/Easy | Self-assessed retention scheduling, not a scored language response |
| Recognition choice | Choose the matching answer | Recognise, independent selection |
| Supported production tiles | Arrange visible answer tiles | Construct, supported |
| Guided spelling | Complete a guided word form | Recall/construct, supported |
| Independent recall | Type the word or phrase without a hint | Recall/produce, independent; bounded to one per day with miss cooldowns |
| Context tiles | Build a sentence in context from tiles | Construct in context, supported; proof is accumulated across days and contexts |
| Rescue support | Visual cue, spelling cue, or answer reveal after a miss | Supported or Revealed encounter; never independent evidence |

Relevant implementations are `src/engine/flashcards.js`, `src/engine/independent-recall.js`, `src/engine/contextual-recall.js`, `src/engine/word-recall.js`, and `src/engine/support-tracking.js`.

## Evidence model

The target evidence vocabulary is additive. Existing learner data remains valid and existing counters keep their current meaning while finer evidence is introduced.

| Target capability | Current proxy | Required foundation work |
| --- | --- | --- |
| Recognise | `recognised`; selection formats | Declare capability explicitly per format |
| Recall | Independent flashcard recall; portions of typed answers | Separate retrieval from constrained construction |
| Construct | `constructed`; wordbank/gap/form; context tiles | Record whether visible answer material constrained the response |
| Produce | `independent`; unassisted typed English→Dutch | Separate written production from speech production |
| Listen | Listening attempts, currently counted as recognised | Add listening evidence without rewriting historical recognition totals |
| Speak | Speaking attempts, currently counted as recognised | Add speech evidence and distinguish transcript accuracy from pronunciation quality |
| Interact | None | Introduce only after turn-taking and response-contingency criteria are defined |
| Retain | Mastery/retention proofs and flashcard scheduling | Make delayed evidence and interval explicit |

Support must be recorded independently of capability:

- **Independent:** no answer-bearing help was used before submission.
- **Supported:** cues constrained or materially assisted the response.
- **Revealed:** the target answer was exposed; useful as learning exposure but not proof.

The current course-level `assisted` boolean can distinguish independent from non-independent attempts, but it cannot distinguish Supported from Revealed. Flashcard support tracking already contains useful precedents for that distinction.

## Baseline gaps and risks

1. Listening and speaking currently advance `recognised`, so the progress model cannot show conversational capability separately.
2. There is no interaction format or turn-taking evidence.
3. Course assistance is binary; answer-bearing reveals and lighter support are not distinguishable in aggregate progress.
4. Release level is implicit. Formats do not declare whether they are Experimental, Practice, Trial, or Core.
5. The listening text fallback safely preserves the exercise item but changes its kind to `choice`; later analytics cannot directly tell that a listening dependency failed.
6. Speaking correctness is based on transcript string matching. It must not be presented as pronunciation assessment.
7. Current progress visualisation is organised around recognised/constructed/independent and cannot yet explain evidence across all eight capabilities.

## Incremental implementation sequence

1. Add a backward-compatible format registry that declares capability, support rules, release level, response mode, and fallback policy without changing scheduling.
2. Add regression tests proving every generated kind has a valid contract and every Core format retains its current behaviour.
3. Extend attempt evidence additively so support level and fallback provenance can be analysed without invalidating existing records.
4. Put the existing hidden-text listening mechanic behind an explicit optional Practice entry point and evaluate it separately from core progression.
5. Visualise the new evidence alongside existing progress counters before allowing it to gate progression.
6. Promote formats one level at a time only when accessibility, scoring reliability, learner comprehension, and data safety checks pass.

The first implementation slice is deliberately non-destructive: introduce the registry and its contract tests. No scheduler, mastery, persistence, or production-data behaviour should change in that slice.

## Implemented foundation

The first two non-behavioural foundations now exist:

- `src/engine/question-formats.js` provides the read-only format contracts and controlled vocabularies;
- `src/engine/format-release.js` provides context gating, a kill switch, sequential promotion requiring owner acceptance, and immediate rollback.

The first optional Practice vertical slice now uses those controls through `src/engine/listening-practice.js` and the Course interface. It presents five familiar hidden-text listening questions, keeps its diagnostic summary in memory for that session only, and never calls the learner-state submission path. Revealing the Dutch text changes the session result from Listen to Recognise. The activity does not consume the daily 20 or alter Course, mastery, retention, Flashcard, or permanent capability progress.

This slice remains on the DAB-168 development branch pending automated, browser, and owner iPhone validation. It has not been promoted to Trial or Core.
