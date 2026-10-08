# DAB-173 — first controlled dialogue slice

Status: owner-reviewed local Practice candidate, 7 October 2026. Not merged or deployed.

## Learner outcome

On the taught S1 topic, the learner can practise a bounded two-turn exchange about a phone problem. The partner asks **Wat is het probleem?** and the learner types any of three appropriate replies already taught in S1 practice.

This is the first DAB-173 slice. It establishes turn-taking, more than one acceptable response, optional support, one repair attempt, consolidated feedback and session-only interaction diagnostics without introducing open chat.

## Format contract

| | |
| --- | --- |
| Capability | Interaction: choose and produce an appropriate response to a partner turn. |
| Role | Optional Practice only. It is not part of the daily 20, mastery, retention or permanent capability progress. |
| Prompt | A short situation plus one visible Dutch partner question. Repeat plays that same line. |
| Response | A typed Dutch reply. Three S1 practice sentences are accepted, ignoring capitalisation and terminal punctuation. |
| Ambiguity boundary | The situation states that the phone is not working. The accepted replies either explain that problem or ask for help using already-taught S1 wording. Other potentially grammatical sentences are not silently treated as proof of handling this specific situation. |
| Help | Clarify shows the English meaning of the partner turn. Phrase support shows partial starts, not complete answers. Either marks a successful response as supported. |
| Repair | The first unsuitable response keeps the same turn open for one repair. The second attempt finishes the exchange, whether or not it fits, so there is no indefinite loop. |
| Feedback | Shows the partner turn, the learner's final reply, suitable alternatives and whether the interaction was independent, supported or repaired. |
| Audio/service failure | The partner's Dutch remains visible. Audio is a repeat aid only, so playback failure cannot block the exchange. |
| Mobile layout | One question card with the reply field before Check reply / Try the repair. The whole dialogue scrolls above the bottom navigation, so the action remains reachable without covering the field or support text. |
| Persistence | The session stays in memory only. Leaving or refreshing discards it. Nothing is written or synced. |
| Release control | `dialogue` is registered at Practice and has an immediate enabled/disabled switch. It cannot enter Trial or Core scheduling. |

## Content

Partner: **Wat is het probleem?** — What is the problem?

Accepted familiar replies:

- **Mijn telefoon werkt niet.** — My phone is not working.
- **Ik heb hulp nodig.** — I need help.
- **Ik heb hulp nodig, want mijn telefoon werkt niet.** — I need help, because my phone is not working.

Each reply is an existing S1 practice sentence. No proof sentence is reused.

## Impact and validation

- No scheduler, daily limit, proof, Flashcard, learner-history, schema, authentication, service, deployment or cost change.
- Automated coverage checks content provenance, multiple accepted replies, support, a single repair, session-only state, release gating, topic placement, mobile action placement and offline caching. The complete suite passes: 592 tests.
- A 390 × 844 development-sandbox check completed the unsuitable reply → visible repair guidance → suitable repair → finite summary path. The Check reply action remained reachable.
- The owner completed the Mac development-sandbox checks for an independent valid reply, a phrase-supported reply, and an unsuitable reply followed by a successful repair. The primary action remained reachable after support and audio-error messages.
- After an initial fixed action covered the reply field on real iPhone Safari, the field and action were returned to document order and the dialogue was made scrollable above the bottom navigation. The owner confirmed that corrected iPhone layout works well.
- The owner confirmed that Repeat plays the Dutch prompt successfully on iPhone through the server-side audio path. The required Mac and real-iPhone validation is complete without advancing the owner's real F2 course progress.

Release: V5.1.182 with offline cache `dutch-v5.1.182-20261008-controlled-dialogue`.

Rollback: disable `CONTROLLED_DIALOGUE_RELEASE.dialogue.enabled`, or revert to the V5.1.181 source at `82f5d35`. No learner data is involved.
