# DAB-188 — slower replay for accepted listening

Status: local candidate on a branch. Optional Practice only. Not merged, not released, and not checked on a phone.

This is the sixth listening step in DAB-170. The issue covers a second voice and a slower speed. This slice adds the slower speed only.

## Owner decisions, 5 October 2026

- Start with the slower speed only, entirely in the app, with no server change and no new cost.
- The second voice is a separate later step. It needs a change to the protected production `listen-tts` function, the owner's approval of that change and its spend, and access to deploy it.
- The slower replay goes only on Practice listening already confirmed on the installed iPhone app:
  - sentence discrimination;
  - missing heard word;
  - short dictation.
- The two-line exchange (DAB-187) joins once it is accepted.

## What the learner sees

In those three rounds a **Play slower** link sits under Play. It plays the same Dutch clip at 0.8 speed. After Check answer, **Hear it slower** sits next to **Hear it again**.

## Rules

| | |
| --- | --- |
| Capability | Still listening comprehension. It is not a new exercise type and adds no question to the daily 20. It is never speaking or interaction evidence. |
| Evidence | An answer given after a slower replay is recorded as supported listening, not independent listening. Feedback shows a “Heard slower” badge, and the summary counts these answers. Replaying slower after Check answer does not change the result. |
| Audio | The same prepared clip, played at 0.8 speed. On the audio-element paths pitch is kept, using `preservesPitch`. On the live app's cached-buffer fast path, a slower replay uses the audio element instead. Only if that fails does it fall back to the buffer, which plays slower at a slightly lower pitch. The device voice uses a slower speaking rate. Normal playback is unchanged. |
| Audio failure | Unchanged. Audio unclear or unavailable converts to the existing visible-text fallback, which is recognition. A slower replay is not counted after that. |
| Service and cost | No server change. The production `listen-tts` function, its voice and the OpenAI key are untouched. No new spend. |
| Resume | Unchanged. The rounds live in the open page and save nothing. |

## What this does not change

The daily 20 and its listening question, the two-line exchange round, mastery, retention, Flashcards, saved progress, the speech service, and running cost stay as they are.

## Checks

Automated: `tests/listening-speed.test.js`, the updated summary checks in the discrimination and missing-word tests, and the full suite.

A headless browser run at phone width with simulated playback confirmed, in all three rounds:
- Play slower plays at 0.8 with pitch kept;
- the next normal Play is back at 1;
- the answer shows “Heard slower”;
- Hear it slower appears after Check answer.

Still needed:
- a slower replay on the installed iPhone app and on the MacBook, to confirm it sounds slower and natural.

## Rollback

Revert the branch. No learner data is involved.
