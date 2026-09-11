# Visual generation service

The visual-memory pipeline is deliberately split between deterministic browser logic and a server-side generator.

## Security boundary

The browser never receives an OpenAI API key. It sends only the selected `cardId` to the Supabase Edge Function `generate-visual`. The function:

1. Requires an authenticated Supabase user.
2. Fetches the card text from the database with the service-role client instead of trusting a browser-supplied prompt.
3. Verifies the authenticated user's server-side generation allowance before contacting OpenAI.
4. Verifies both count-based limits and a configured monthly GBP cost ceiling.
5. Reserves one generation attempt and its configured estimated cost in `visual_generation_log` before any API spend.
6. Enforces a database-level one-active-reservation-per-card rule so double clicks, concurrent tabs or duplicate requests cannot start two paid generations for the same card.
7. Builds the educational image prompt on the server.
8. Calls the OpenAI Images API.
9. Stores the returned image in Supabase Storage.
10. Writes the resulting HTTPS URL to `cards.image_url` and marks the audit attempt as succeeded.
11. Marks failed attempts with a terminal failure state so audit history distinguishes success, failure and an in-progress reservation.
12. Returns only the card id, stored image URL, accessible alt text, model name and configured estimated cost.

The function is **disabled by default**. `VISUAL_GENERATION_ENABLED=true` must be set before it can spend API credit.

## No-spend preflight

An authenticated client can call the same function with `{ "action": "status" }`. This path never contacts OpenAI and never inserts a generation-attempt row. It checks the deployment before the UI offers a spending button, including:

- whether generation is enabled;
- whether an OpenAI key is present server-side;
- whether daily/monthly attempt limits and GBP budget settings are usable;
- whether the private audit table can be read;
- whether the configured Storage bucket exists and is public;
- the authenticated user's remaining daily, monthly and estimated GBP allowance.

The app rechecks this status immediately before a confirmed generation. The Edge Function still repeats every budget check itself, so the preflight is informative rather than an authorization boundary.

## Duplicate-spend protection

`visual_generation_log.status` has three states: `reserved`, `succeeded` and `failed`. A partial unique index permits only one `reserved` row for a card at any moment. The server creates that reservation before contacting OpenAI, so two concurrent requests cannot both get as far as a paid generation call for the same card.

A reservation older than 15 minutes is treated as stale and marked failed before a new reservation is attempted. This prevents an interrupted Edge Function invocation from blocking the card forever. Failed attempts still count against the conservative daily/monthly and estimated-cost allowances because an upstream provider may already have incurred cost before the failure became visible locally.

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

Run all migrations before enabling the function:

- `supabase/migrations/20260911_visual_generation_log.sql`
- `supabase/migrations/20260911_visual_generation_cost_budget.sql`
- `supabase/migrations/20260911_visual_generation_attempt_state.sql`

The audit table has RLS enabled and deliberately has no client policies; only the Edge Function's service-role client should access it. A generation attempt and its configured estimated cost are recorded before the OpenAI call, so a failed request still consumes that day's/month's allowance and estimated budget. This is intentionally conservative: an upstream failure should not allow repeated retries to create uncontrolled spend.

Setting either count limit to `0` disables spending even if `VISUAL_GENERATION_ENABLED=true`. Cost protection fails closed too: if either `VISUAL_GENERATION_ESTIMATED_COST_GBP` or `VISUAL_GENERATION_MONTHLY_BUDGET_GBP` is missing, zero or invalid, the function refuses to generate. Existing card images are returned without consuming any allowance.

The GBP figure is an internal conservative estimate, not an invoice from OpenAI. Review and update `VISUAL_GENERATION_ESTIMATED_COST_GBP` whenever the image model, image settings or provider pricing changes. Keeping the estimate deliberately high is safer than under-estimating it.

Create the Storage bucket named by `VISUAL_STORAGE_BUCKET` as a public bucket before enabling generation. The generated cues contain vocabulary illustrations rather than personal data, and a durable public HTTPS URL lets the existing PWA cache the image for offline recall.

## Activation order

Do not enable generation merely because the Edge Function exists. The browser-side pipeline must still establish all of the following first:

`genuine repeated recall difficulty -> structural suitability -> semantic suitability -> generation plan -> authenticated preflight -> explicit confirmation -> server count budget -> server GBP budget -> unique reservation -> generation -> terminal audit outcome`

V5.1.71 adds database-backed duplicate-spend protection and explicit generation attempt outcomes. It prevents concurrent requests for the same card from starting multiple paid image generations and safely releases stale reservations after 15 minutes.
