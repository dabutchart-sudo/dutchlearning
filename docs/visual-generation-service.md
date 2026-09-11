# Visual generation service

The visual-memory pipeline is deliberately split between deterministic browser logic and a server-side generator.

## Security boundary

The browser never receives an OpenAI API key. It sends only the selected `cardId` to the Supabase Edge Function `generate-visual`. The function:

1. Requires an authenticated Supabase user.
2. Fetches the card text from the database with the service-role client instead of trusting a browser-supplied prompt.
3. Verifies the authenticated user's server-side generation allowance before contacting OpenAI.
4. Verifies both count-based limits and a configured monthly GBP cost ceiling.
5. Reserves one generation attempt and its configured estimated cost in `visual_generation_log` before any API spend.
6. Builds the educational image prompt on the server.
7. Calls the OpenAI Images API.
8. Stores the returned image in Supabase Storage.
9. Writes the resulting HTTPS URL to `cards.image_url` and the audit row.
10. Returns only the card id, stored image URL, accessible alt text, model name and configured estimated cost.

The function is **disabled by default**. `VISUAL_GENERATION_ENABLED=true` must be set before it can spend API credit.

## Required server configuration

Supabase normally provides `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Add these project secrets/settings as required:

- `OPENAI_API_KEY` — server-side only; never add it to GitHub or client JavaScript.
- `OPENAI_IMAGE_MODEL` — optional; defaults to `gpt-image-2`.
- `VISUAL_STORAGE_BUCKET` — optional; defaults to `visual-cues`.
- `VISUAL_GENERATION_DAILY_LIMIT` — optional; defaults to `1` attempted generation per authenticated user per UTC day.
- `VISUAL_GENERATION_MONTHLY_LIMIT` — optional; defaults to `10` attempted generations per authenticated user per UTC month.
- `VISUAL_GENERATION_ESTIMATED_COST_GBP` — required before spending is enabled. Set this to a conservative upper-bound estimate for one image using the chosen model/settings.
- `VISUAL_GENERATION_MONTHLY_BUDGET_GBP` — required before spending is enabled. This is the hard estimated monthly visual-generation ceiling per authenticated user.
- `VISUAL_GENERATION_ENABLED` — set to `true` only when the service, migrations and all budget controls are ready.

Run both migrations before enabling the function:

- `supabase/migrations/20260911_visual_generation_log.sql`
- `supabase/migrations/20260911_visual_generation_cost_budget.sql`

The audit table has RLS enabled and deliberately has no client policies; only the Edge Function's service-role client should access it. A generation attempt and its configured estimated cost are recorded before the OpenAI call, so a failed request still consumes that day's/month's allowance and estimated budget. This is intentionally conservative: an upstream failure should not allow repeated retries to create uncontrolled spend.

Setting either count limit to `0` disables spending even if `VISUAL_GENERATION_ENABLED=true`. Cost protection fails closed too: if either `VISUAL_GENERATION_ESTIMATED_COST_GBP` or `VISUAL_GENERATION_MONTHLY_BUDGET_GBP` is missing, zero or invalid, the function refuses to generate. Existing card images are returned without consuming any allowance.

The GBP figure is an internal conservative estimate, not an invoice from OpenAI. Review and update `VISUAL_GENERATION_ESTIMATED_COST_GBP` whenever the image model, image settings or provider pricing changes. Keeping the estimate deliberately high is safer than under-estimating it.

Create the Storage bucket named by `VISUAL_STORAGE_BUCKET` as a public bucket before enabling generation. The generated cues contain vocabulary illustrations rather than personal data, and a durable public HTTPS URL lets the existing PWA cache the image for offline recall.

## Activation order

Do not enable automatic generation merely because the Edge Function exists. The browser-side pipeline must still establish all of the following first:

`genuine repeated recall difficulty -> structural suitability -> semantic suitability -> generation plan -> count budget -> GBP budget -> generation`

V5.1.67 adds a second spending guard based on an explicitly configured monthly GBP ceiling, in addition to the existing daily/monthly attempt limits. It still does not automatically invoke generation from the learning UI.
