# DAB-185 — missing heard word

Status: local candidate on a branch. Optional Practice only. Not merged, not released, and not checked on a phone.

This is the third listening step in DAB-170, after hidden-text meaning selection and sentence discrimination.

## What the learner does

On a topic that has already been taught, open the topic and choose **Which word did you hear?** The learner taps Play. Once the Dutch audio starts, the sentence appears with one word replaced by a gap, along with three word choices. The learner chooses the word they heard, then Check answer.

The round contains at most five questions. Leaving it saves nothing.

## Format contract

| | |
| --- | --- |
| Capability | Listening, but only as a session diagnostic. A heard answer does not change Course, mastery, retention, or the capability profile. |
| Role | Practice. It is not a lesson step, a daily question, or a proof. |
| Prompt | Dutch audio only at first. The gapped sentence and the choices stay hidden until the audio starts. The missing word stays hidden until feedback. |
| Missing word | The finite verb the topic already teaches, at the sentence's recorded verb position. |
| Response | Choose one of three Dutch words. |
| Acceptable answer | The heard word, ignoring capital letters. The other two words are finite verbs from other practice sentences in the same topic, with the same subject agreement (ik form, jij form, u form, third person singular, or plural). Every option therefore fits the sentence grammatically, so only the audio tells them apart. Other forms of the heard verb are never options, so near-homophones such as *word* and *wordt* never compete. Proof sentences are never used. |
| Ambiguity | A different option can also make a sensible Dutch sentence. That is intended: the learner is choosing what they heard, not what is possible. |
| Near miss | A wrong choice is simply not the heard word. Feedback shows the full sentence with the heard word marked, its English meaning, and the word that was chosen. |
| Help | Replaying the audio is not help. There is no “show the answer” control before Check answer. |
| Audio failure | **Audio unclear** or **Audio unavailable** shows the gapped sentence and its English meaning. The learner then chooses the missing word. That answer is recognition, not listening, and the round continues. If the audio never starts, the gap stays hidden and the screen explains the problem, so the learner uses this fallback. |
| Repeated failure | The round stays finite. A miss is explained, then the next question appears. No extra questions are added. |
| Offline or service failure | The same Dutch audio path as the rest of the app is used. If it cannot play, the fallback above keeps this optional round moving. The normal daily session is separate and is not blocked. |
| Phone layout | One question card with Check answer kept reachable at the bottom. The layout matches the sentence-discrimination round. |
| Resume | The round lives only in the open page. Refreshing or leaving discards it. Nothing is written to learner history or synced. |

## Which topics offer it

A topic offers the round when at least one practice sentence has two other same-topic sentences whose finite verb is a different verb with the same agreement. With the current course this is 28 topics.

It is not offered for F4, F5, A1.6, A1.9, A1.13 or A1.22. In those topics, either the finite word is the same auxiliary in almost every sentence, or too few sentences share agreement. Offering a choice there would test grammar or guessing, not listening. Making the round available there would need a different missing-word rule and a separate decision.

## What this does not change

The normal daily listening question, the 20-question day, mastery, retention, Flashcards, saved progress, the speech service, and running cost stay as they are. No new audio service or spend is added.

## Checks

Automated: `tests/listening-missing-word.test.js` and the full suite.

A headless browser run at phone width confirmed:
- the gap and the choices stay hidden before audio;
- Check answer before audio asks the learner to play it first;
- the Audio unavailable and Audio unclear paths;
- the summary;
- leaving the round;
- saved learner state, the daily count, and the attempt history are unchanged.

The heard path could not be played in the headless browser. The live sentence-discrimination round behaves the same way there.

Still needed before acceptance:
- a heard round on the installed iPhone app and on the MacBook, with the sentence staying hidden until the audio starts;
- an owner review of the wording and the choice of missing word.

## Rollback

Set `MISSING_WORD_RELEASE.listening.enabled` to `false` in `src/engine/listening-missing-word.js` to hide the offer, or revert the branch. No learner data is involved.
