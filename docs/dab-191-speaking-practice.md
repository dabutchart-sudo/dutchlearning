# DAB-191 — optional assessed speaking practice

Status: on the live app as V5.1.174, with production transcription enabled on 5 October 2026. The owner asked for this slice on the live app after accepting the wording and setting the transcription spend limit at £5 per month. The production budget migration is applied and the authenticated `speaking-transcription` function is active. The owner confirmed the real MacBook recording path works, including after a Dutch-language transcription cue was added for learner speech. DAB-191 stays in progress until the installed-iPhone path is checked before any later Trial.

## This slice

On a topic the learner has already started, the topic page offers a short optional Practice activity.

- The prompt is the English sentence. The Dutch stays hidden until the answer is checked.
- On a development copy, Record sends the audio to the existing local preview route, `/preview/stt`. On the live origin, a signed-in learner’s recording is sent to the `speaking-transcription` function when that function is available. The page never receives a provider key.
- The function is deployed with `SPEAKING_TRANSCRIPTION_ENABLED=true`. Each attempt reserves £0.02 before OpenAI is called, and the month stops at £5. A recording is limited to 15 seconds and 600KB. The budget table in `supabase/migrations/20261005_speaking_transcription_budget.sql` is applied. The OpenAI transcription request specifies Dutch and includes a neutral Dutch cue for beginner speech; it does not include the expected answer.
- If transcription is unavailable, Record asks the learner to type. A typed answer is writing practice and is not speaking evidence.
- The transcript is compared with the Dutch sentence. An exact word match is “Understood”. A very small difference is “Very close”. Anything else is “Not this time”.
- This comparison is about the words. It is not a pronunciation score.
- A spoken miss can be tried once more. The kept answer is the one that counts in the session summary.
- Type instead, or a recording that cannot be transcribed, finishes the item as writing. That answer is not speaking evidence.
- Leaving the activity returns to the topic. Nothing is added to Course, mastery, retention, or the saved learning record.
- The normal daily session still has its one skippable spoken question. Mastery and retention stay written.

## What this does not change

No new provider and no OpenAI Realtime. The £5 monthly cap is enforced by a server-only additive table and atomic reservation before each OpenAI call. Three successful live checks reserved £0.06 on 5 October. `listen-tts` is unchanged. The daily 20, scheduler, learner history, and authentication stay as they are. The offline cache is `dutch-v5.1.174-20261005-speaking-practice`. Rollback of the app is the V5.1.173 main source at `c80515ebf20585e153ab7b752d5b224820a4852a`; switching `SPEAKING_TRANSCRIPTION_ENABLED` off stops new transcription without touching `listen-tts`. The budget table is additive and browser roles have no access to it.

DAB-172 stays open. Controlled dialogue stays waiting.
