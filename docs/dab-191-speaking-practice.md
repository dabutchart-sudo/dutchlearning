# DAB-191 — optional assessed speaking practice

Status: in source, 5 October 2026. Not on the live app. No version change. The owner said to begin Assessed Speaking on 5 October 2026 and accepted this wording the same day. DAB-191 stays in progress. iPhone and MacBook checks are still outstanding before any later Trial. Speech on the live app still needs an owner spend limit for a production transcription route.

## This slice

On a topic the learner has already started, the topic page offers a short optional Practice activity.

- The prompt is the English sentence. The Dutch stays hidden until the answer is checked.
- Record sends the audio to the existing local preview route, `/preview/stt`. The page never receives a provider key.
- The transcript is compared with the Dutch sentence. An exact word match is “Understood”. A very small difference is “Very close”. Anything else is “Not this time”.
- This comparison is about the words. It is not a pronunciation score.
- A spoken miss can be tried once more. The kept answer is the one that counts in the session summary.
- Type instead, or a recording that cannot be transcribed, finishes the item as writing. That answer is not speaking evidence.
- Leaving the activity returns to the topic. Nothing is added to Course, mastery, retention, or the saved learning record.
- The normal daily session still has its one skippable spoken question. Mastery and retention stay written.

## What this does not change

No new provider, no OpenAI Realtime, and no new production transcription service. No spend is added. The daily 20, scheduler, learner history, schema, and authentication stay as they are. The offline cache name stays `dutch-v5.1.173-20261004-course-outcomes` until a later release. Rollback of this source slice is the V5.1.173 main source at `c80515ebf20585e153ab7b752d5b224820a4852a`.

DAB-172 stays open. Controlled dialogue stays waiting.
