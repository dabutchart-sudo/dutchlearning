# DAB-187 — two-line exchange

Status: on the live app as V5.1.177, 5 October 2026. Optional Practice only. The owner asked for release, merge and deployment on 5 October, before a separate check of the Dutch below was reported. No phone check had been done at release.

This is the fifth listening step in DAB-170, after hidden-text meaning selection, sentence discrimination, missing heard word and short dictation.

## Owner decisions, 5 October 2026

- The exchanges are a small written set, about four per topic that teaches questions. They use only words the course already practises, and the owner checks the Dutch before release.
- After hearing both turns, the learner chooses the meaning of the whole exchange from three options.

## What the learner does

On A1.2, A1.8, A1.14, A1.23, A1.24, S1, S2 or S3, open the topic and choose **Follow a short exchange**. The learner taps Play and hears a question and its reply. Three English meanings appear once the audio starts. The learner chooses what was said, then Check answer.

The round contains at most five exchanges. Leaving it saves nothing. Earlier topics (F1 to A1.1) do not offer it, because questions are first taught in A1.2.

## Format contract

| | |
| --- | --- |
| Capability | Listening, as a session diagnostic only. Hearing an exchange is not taking part in one, so it is never interaction or speaking evidence. It does not change Course, mastery, retention, or the capability profile. |
| Role | Practice. It is not a lesson step, a daily question, or a proof. |
| Prompt | Dutch audio only: the question and the reply, played as one clip in one voice. The turns stay hidden until feedback. The choices appear once the audio starts. Different voices for each speaker are a later step (DAB-188). |
| Content | 35 written exchanges in `src/content/listening-exchanges.js`, four or five per topic. A test checks that every Dutch word is already used by a practice sentence in that topic or an earlier one, that no line is an unseen test sentence, and that each clip is at most 110 characters. |
| Response | Choose one of three English meanings of the whole exchange. |
| Acceptable answer | The meaning of both turns. One wrong option changes a detail of the question, the other a detail of the reply, so the learner has to follow both turns. |
| Near miss | None. A wrong choice is not what was said. Feedback shows both Dutch turns with their English, and the choice that was made. |
| Help | Replaying the audio is not help. There is no reveal before Check answer. |
| Audio failure | **Audio unclear** or **Audio unavailable** shows both turns as text, with the same three choices. That answer is recognition, not listening, and the round continues. If the audio never starts, the choices stay hidden and the screen explains the problem, so the learner uses this fallback. |
| Repeated failure | The round stays finite. A miss is explained, then the next exchange appears. No extra questions are added. |
| Offline or service failure | The same Dutch audio path as the rest of the app is used. The normal daily session is separate and is not blocked. |
| Phone layout | One question card with Check answer kept reachable at the bottom. Same layout as the other listening rounds. |
| Resume | The round lives only in the open page. Refreshing or leaving discards it. Nothing is written to learner history or synced. |

## The exchanges

For the owner's Dutch check. Each line uses only words already in the course's practice sentences.

| Topic | A | B | Meaning |
| --- | --- | --- | --- |
| A1.2 | Drinkt zij thee? | Zij drinkt water. | Does she drink tea? — She drinks water. |
| A1.2 | Lees jij een boek? | Ik lees de krant. | Are you reading a book? — I am reading the newspaper. |
| A1.2 | Zoek jij een winkel? | Ik zoek het station. | Are you looking for a shop? — I am looking for the station. |
| A1.2 | Koop jij een fiets? | Ik koop een auto. | Are you buying a bike? — I am buying a car. |
| A1.2 | Ziet hij de hond? | Hij ziet de kat. | Does he see the dog? — He sees the cat. |
| A1.8 | Waar woon jij? | Ik woon bij de winkel. | Where do you live? — I live near the shop. |
| A1.8 | Wat lees jij? | Ik lees een boek. | What are you reading? — I am reading a book. |
| A1.8 | Wanneer werk jij? | Ik werk vandaag. | When do you work? — I work today. |
| A1.8 | Wie kookt vanavond? | Mijn zus kookt vanavond. | Who is cooking tonight? — My sister is cooking tonight. |
| A1.8 | Waar werkt hij? | Hij werkt op het station. | Where does he work? — He works at the station. |
| A1.14 | Werk jij vandaag thuis? | Ik werk vandaag in de stad. | Are you working at home today? — I am working in the city today. |
| A1.14 | Heb jij een fiets? | Ik heb geen fiets. | Do you have a bike? — I do not have a bike. |
| A1.14 | Wanneer werken jullie? | Wij werken morgen. | When are you working? — We are working tomorrow. |
| A1.14 | Waarom leert zij Nederlands? | Zij werkt in Utrecht. | Why is she learning Dutch? — She works in Utrecht. |
| A1.14 | Hoe ga jij naar school? | Ik loop naar school. | How do you get to school? — I walk to school. |
| A1.23 | Mag ik een koffie, alstublieft? | Een koffie kost drie euro. | May I have a coffee, please? — A coffee costs three euros. |
| A1.23 | Wat kost een koffie? | Een koffie kost twee euro. | What does a coffee cost? — A coffee costs two euros. |
| A1.23 | Kan ik hier betalen? | U kunt hier betalen. | Can I pay here? — You can pay here. |
| A1.23 | Mag ik de rekening, alstublieft? | De rekening is twaalf euro. | May I have the bill, please? — The bill is twelve euros. |
| A1.24 | Wil je koffie of wil je thee? | Ik wil thee, maar ik wil geen suiker. | Would you like coffee or tea? — I would like tea, but no sugar. |
| A1.24 | Wat doe jij vandaag? | Eerst werk ik, daarna ga ik naar huis. | What are you doing today? — First I work, then I go home. |
| A1.24 | Waarom blijf jij thuis? | Ik blijf thuis, want ik ben moe. | Why are you staying at home? — I am staying at home because I am tired. |
| A1.24 | Wat drinken jullie? | Ik drink koffie en zij drinkt thee. | What are you all drinking? — I am drinking coffee and she is drinking tea. |
| S1 | Kunt u mij helpen? | Mijn telefoon werkt niet. | Can you help me? — My phone is not working. |
| S1 | Waar is de trein? | De trein is te laat. | Where is the train? — The train is late. |
| S1 | Begrijpt zij het? | Ik begrijp het niet. | Does she understand? — I do not understand. |
| S1 | Wat is het probleem? | Ik heb hulp nodig, want mijn fiets werkt niet. | What is the problem? — I need help, because my bike is not working. |
| S2 | Hoe heet u? | Ik heet Jan. | What is your name? — My name is Jan. |
| S2 | Waar woon jij? | Ik woon in Amsterdam. | Where do you live? — I live in Amsterdam. |
| S2 | Hoe heet jij? | Ik heet Jan, en ik woon in Amsterdam. | What is your name? — My name is Jan, and I live in Amsterdam. |
| S2 | Wie is dat? | Dat is mijn zus. Zij heet Lisa. | Who is that? — That is my sister. She is called Lisa. |
| S3 | Wanneer is de afspraak? | De afspraak is om half drie. | When is the appointment? — The appointment is at half past two. |
| S3 | Komt u om half drie? | Ik kom om twee uur. | Are you coming at half past two? — I am coming at two o’clock. |
| S3 | Heb jij vandaag een afspraak? | Ik heb maandag een afspraak. | Do you have an appointment today? — I have an appointment on Monday. |
| S3 | Wanneer komen jullie? | Wij komen om elf uur. | When are you coming? — We are coming at eleven o’clock. |

## What this does not change

The normal daily listening question, the 20-question day, mastery, retention, Flashcards, saved progress, the course sentences and proof pools, the speech service, and running cost stay as they are. The exchanges are not added to the course sentence bank. No new audio service or spend is added.

## Checks

Automated: `tests/listening-exchange.test.js` and the full suite.

A headless browser run at phone width, with audio playback simulated, on a learner at A1.2, confirmed:
- the choices stay hidden before audio;
- Check answer before audio asks the learner to play it first;
- the choices appear once audio starts, and an answer is marked;
- both audio-failure paths, the summary, and leaving the round;
- saved learner state, the daily count and attempt history are unchanged.

Still needed:
- the owner's check of the Dutch above;
- an exchange round on the installed iPhone app and on the MacBook.

## Rollback

Revert to the V5.1.176 main source at `9adaf8f`, or set `EXCHANGE_RELEASE.listening.enabled` to `false` in `src/engine/listening-exchange.js` to hide the offer, or revert the branch. No learner data is involved.
