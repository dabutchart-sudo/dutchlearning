# Listen and speak — isolated test area

Production as Zin V5.1.124. Linear: DAB-146. Owner direction 2026-09-20. GitHub Pages Listen uses device voices. OpenAI MP3 Listen is the LAN development server only until a speech Edge Function exists.

## Aim for today

A local test area where one listening exercise and one speaking exercise can be tried without changing production Today, Flashcards, scheduling, Learning sync or learner data.

## Scope

- Sample item only: `Ik drink koffie.` / `I drink coffee.`
- Listening: play OpenAI Dutch audio, choose the English meaning. The sample sentence is generated once and cached so later Plays are immediate.
- Speaking: record a spoken Dutch reply; the preview server transcribes it with OpenAI and scores it locally. Skip speaking to type the same sentence, or tick “Skip speaking and stay with listening”.
- The browser never receives `OPENAI_API_KEY`.
- Service workers are disabled on this preview origin.
- Practice on existing topics includes optional listening and speaking kinds. Existing learner history defaults speaking off. A spoken question can be skipped and typed without adding work.

## Files

- `src/engine/listen-speak-preview.js`: sample item and scoring only.
- `preview/listen-speak.html`, `.js`, `.css`: isolated UI.
- `preview/serve-listen-speak.py`: local server and OpenAI proxy.
- `tests/listen-speak-preview.test.js`: scoring and isolation regressions.
- `DESIGN.md`, `AGENTS.md`, `DEVELOPMENT.md`: recorded high-priority direction.

## Review it

From the repository root:

```bash
OPENAI_API_KEY=… python3 preview/serve-listen-speak.py
```

Then open:

http://127.0.0.1:19086/preview/listen-speak.html

The key may also be read from an uncommitted local `.env`. Do not commit that file. If the key is missing, the page still opens and explains that audio cannot run yet.

This server is local-only. It is not a production Edge Function and does not replace `generate-sentences` or `generate-visual`.
