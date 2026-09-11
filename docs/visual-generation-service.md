# Visual generation service

The visual-memory pipeline is deliberately split between deterministic browser logic and a server-side generator.

## Security boundary

The browser never receives an OpenAI API key. It sends only the selected `cardId` to the Supabase Edge Function `generate-visual`. The function:

1. Requires an authenticated Supabase user.
2. Fetches the card text from the database with the service-role client instead of trusting a browser-supplied prompt.
3. Verifies the authenticated user's server-side generation allowance before contacting OpenAI.
4. Reserves one generation attempt in `visual_generation_log` before any API spend.
5. Builds the educational image prompt on the server.
6. Calls the OpenAI Images API.
7. Stores the returned image in Supabase Storage.
8. Writes the resulting HTTPS URL to `cards.image_url` and the audit row.
9. Returns only the card id, stored image URL, accessible alt text and model name.

The function is **disabled by default**. `VISUAL_GENERATION_ENABLED=true` must be set before it will spend API credit.

## Required server configuration

Supabase normally provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Add these project secrets/settings as required:

- `OPENAI_API_KEY` — server-side only; never add it to GitHub or client JavaScript.
- `OPENAI_IMAGE_MODEL` — optional; defaults to `gpt-image-2`.
- `VISUAL_STORAGE_BUCKET` — optional; defaults to `visual-cues`.
- `VISUAL_GENERATION_DAILY_LIMIT` — optional; defaults to `1` attempted generation per authenticated user per UTC day.
- `VISUAL_GENERATION_MONTHLY_LIMIT` — optional; defaults to `10` attempted generations per authenticated user per UTC month.
- `VISUAL_GENERATION_ENABLED` — set to `true` only when the service, migration and budget controls are ready.

Run `supabase/migrations/20260911_visual_generation_log.sql` before enabling the function. The audit table has RLS enabled and deliberately has no client policies; only the Edge Function's service-role client should access it. A generation attempt is recorded before the OpenAI call, so a failed request still consumes that day's/month's allowance. This is intentionally conservative: an upstream failure should not allow repeated retries to create uncontrolled spend.

Setting either server limit to `0` disables spending even if `VISUAL_GENERATION_ENABLED=true`. The default limits mean that an authenticated account can initiate at most one new image attempt in a UTC day and ten in a UTC month. Existing card images are returned without consuming an allowance.

Create the Storage bucket named by `VISUAL_STORAGE_BUCKET` as a public bucket before enabling generation. The generated cues contain vocabulary illustrations rather than personal data, and a durable public HTTPS URL lets the existing PWA cache the image for offline recall.

## Activation order

Do not enable automatic generation merely because the Edge Function exists. The browser-side pipeline must still establish all of the following first:

`genuine repeated recall difficulty -> structural suitability -> semantic suitability -> generation plan -> server budget admission`

V5.1.66 adds conservative server-side usage governance and audit logging. It still does not automatically invoke generation from the learning UI. The next activation step should expose the generation state carefully and keep user-visible generation constrained by the existing genuine-need pipeline.
