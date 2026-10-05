# DAB-186 — short dictation

Status: on the live app as V5.1.176, 5 October 2026. Optional Practice only. The owner asked for release, merge and deployment on 5 October. No phone check had been done at release. Later on 5 October the owner confirmed that the round works on the installed iPhone app. A MacBook check has not been reported.

This is the fourth listening step in DAB-170, after hidden-text meaning selection, sentence discrimination and missing heard word.

## What the learner does

On a taught topic, open the topic and choose **Type what you hear**. The learner taps Play and hears a short Dutch sentence. The text box opens once the audio starts. The learner types what they heard, then Check answer (or Return). The audio can be replayed as often as needed.

The round contains at most five questions. Leaving it saves nothing.

## Format contract

| | |
| --- | --- |
| Capability | Listening plus writing, as a session diagnostic only. It is never speaking evidence. A typed answer does not change Course, mastery, retention, or the capability profile. |
| Role | Practice. It is not a lesson step, a daily question, or a proof. |
| Prompt | Dutch audio only. The sentence is never shown before Check answer. The only visible help is the number of words. |
| Sentences | Practice sentences from the taught topic with 2 to 6 words. Proof sentences are never used. Every topic currently has enough of them. |
| Response | Type the Dutch sentence. Autocorrect, autocapitalise and spellcheck are off. |
| Acceptable answer | The heard words in order. Capital letters and punctuation are ignored. |
| Near miss | A one-letter slip in a word of four or more letters (for example *boeck* for *boek*) counts as a spelling slip: the word was heard, but the answer is not exact. A sentence whose only faults are such slips is reported as “Every word heard — check the spelling”. |
| Failure | Feedback shows the full sentence and marks each word as heard, misspelled or not heard. It lists typed words that were not in the sentence, and shows the English meaning and what was typed. Words are aligned in order, so one missed word does not mark every later word wrong. |
| Help | Replaying the audio is not help. There is no reveal before Check answer. |
| Audio failure | **Audio unclear** or **Audio unavailable** shows the Dutch sentence and asks for its English meaning from three choices. That answer is recognition, not listening, and the round continues. If the audio never starts, the text box stays closed and the screen explains the problem, so the learner uses this fallback. |
| Repeated failure | The round stays finite. A miss is explained, then the next question appears. No extra questions are added. |
| Offline or service failure | The same Dutch audio path as the rest of the app is used. The normal daily session is separate and is not blocked. |
| Phone layout | One question card with Check answer kept reachable at the bottom. Same layout as the other listening rounds. |
| Resume | The round lives only in the open page. Refreshing or leaving discards it. Nothing is written to learner history or synced. |

## Playback change in this branch

The live app's speech path already reported when the Dutch audio started. The development-copy path (Mac or `192.168…`) and the device-voice fallback did not. On a development copy that kept missing-word choices hidden, and it would keep the dictation box closed, so neither round could be tested there.

Both paths now report start and end in the same way, guarded against a late start from an earlier tap. The live-site playback path is unchanged. Both rounds also ignore a late audio start from a screen that has already been left.

## What this does not change

The normal daily listening question, the 20-question day, mastery, retention, Flashcards, saved progress, the speech service, and running cost stay as they are. No new audio service or spend is added.

## Checks

Automated: `tests/listening-dictation.test.js` and the full suite.

A headless browser run at phone width, with audio playback simulated, confirmed:
- the text box stays closed before audio;
- Check answer before audio asks the learner to play it first;
- the text box opens once audio starts, and a typed answer is marked;
- both audio-failure paths, the summary, and leaving the round;
- saved learner state, the daily count and attempt history are unchanged.

The same run confirmed that the missing-word round now reveals its choices on a development copy.

Installed iPhone app: on 5 October, after V5.1.176 was deployed, the owner reported that the round works. A MacBook check has not been reported.

## Rollback

Revert to the V5.1.175 main source at `f67c0d5`, or set `DICTATION_RELEASE.listening.enabled` to `false` in `src/engine/listening-dictation.js` to hide the offer, or revert the branch. No learner data is involved.
