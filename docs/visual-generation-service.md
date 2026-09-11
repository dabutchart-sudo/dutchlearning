# Visual generation service

The visual-memory pipeline is deliberately split between deterministic browser logic and a server-side generator.

## Security boundary

The browser never receives an OpenAI API key. It sends only the selected `cardId` to the Supabase Edge Function `generate-visual`. The function:

1. Requires an authenticated Supabase user.
2. Fetches the card text from the database with the service-role client instead of trusting a browser-supplied prompt.
3. Builds the educational image prompt on the server.
4. Calls the OpenAI Images API.
5. Stores the returned image in Supabase Storage.
6. Writes the resulting HTTPS URL to `cards.image_url`.
7. Returns only the card id, stored image URL, accessible alt text and model name.

The function is **disabled by default**. `VISUAL_GENERATION_ENABLED=true` must be set before it will spend API credit.

## Required server configuration

Supabase normally provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Add these project secrets/settings as required:

- `OPENAI_API_KEY` — server-side only; never add it to GitHub or client JavaScript.
- `OPENAI_IMAGE_MODEL` — optional; defaults to `gpt-image-2`.
- `VISUAL_STORAGE_BUCKET` — optional; defaults to `visual-cues`.
- `VISUAL_GENERATION_ENABLED` — set to `true` only when the service and budget controls are ready.

Create the Storage bucket named by `VISUAL_STORAGE_BUCKET` as a public bucket before enabling generation. The generated cues contain vocabulary illustrations rather than personal data, and a durable public HTTPS URL lets the existing PWA cache the image for offline recall.

## Activation order

Do not enable automatic generation merely because the Edge Function exists. The browser-side pipeline must still establish all of the following first:

`genuine repeated recall difficulty -> structural suitability -> semantic suitability -> generation plan`

V5.1.65 adds the secure service boundary and response validation but does not automatically invoke generation from the learning UI. A later build should add usage telemetry / budget governance before enabling user-facing generation.
