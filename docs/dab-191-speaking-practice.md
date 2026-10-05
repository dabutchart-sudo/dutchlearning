# DAB-191 — optional assessed speaking practice

Status: on the live app as V5.1.174, 5 October 2026. The owner asked for this slice on the live app after accepting the wording and setting the transcription spend limit at £5 per month. DAB-191 stays in progress. An installed-phone check and a MacBook check of a real recording are still outstanding before any later Trial. The production transcription function and its budget table are in source and were not deployed with this release, so Record on the live app asks the learner to type.

## This slice

On a topic the learner has already started, the topic page offers a short optional Practice activity.

- The prompt is the English sentence. The Dutch stays hidden until the answer is checked.
- On a development copy, Record sends the audio to the existing local preview route, `/preview/stt`. On the live origin, a signed-in learner’s recording is sent to the `speaking-transcription` function when that function is available. The page never receives a provider key.
- The function stays off until it is deployed and `SPEAKING_TRANSCRIPTION_ENABLED=true`. Each attempt reserves £0.02 before OpenAI is called, and the month stops at £5. A recording is limited to 15 seconds and 600KB. The budget table is in `supabase/migrations/20261005_speaking_transcription_budget.sql` and has not been applied. This release environment has no Supabase access token, so the table was not applied and the function was not enabled.
- Until that route is live, Record on the study origin asks the learner to type. A typed answer is writing practice and is not speaking evidence.
- The transcript is compared with the Dutch sentence. An exact word match is “Understood”. A very small difference is “Very close”. Anything else is “Not this time”.
- This comparison is about the words. It is not a pronunciation score.
- A spoken miss can be tried once more. The kept answer is the one that counts in the session summary.
- Type instead, or a recording that cannot be transcribed, finishes the item as writing. That answer is not speaking evidence.
- Leaving the activity returns to the topic. Nothing is added to Course, mastery, retention, or the saved learning record.
- The normal daily session still has its one skippable spoken question. Mastery and retention stay written.

## What this does not change

No new provider and no OpenAI Realtime. The £5 monthly cap is recorded. No spend has been added, because the function is not deployed. `listen-tts` is unchanged. The daily 20, scheduler, learner history, and authentication stay as they are. The offline cache is `dutch-v5.1.174-20261005-speaking-practice`. Rollback of the app is the V5.1.173 main source at `c80515ebf20585e153ab7b752d5b224820a4852a`. If the function is deployed later, switching `SPEAKING_TRANSCRIPTION_ENABLED` off stops new transcription without touching `listen-tts`. The budget table is additive.

DAB-172 stays open. Controlled dialogue stays waiting.
