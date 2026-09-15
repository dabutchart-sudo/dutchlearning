create table if not exists public.visual_generation_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_id bigint not null,
  model text not null,
  created_at timestamptz not null default now(),
  image_url text null
);

create index if not exists visual_generation_log_user_created_idx
  on public.visual_generation_log (user_id, created_at desc);

create index if not exists visual_generation_log_card_idx
  on public.visual_generation_log (card_id, created_at desc);

alter table public.visual_generation_log enable row level security;

-- No client policies are created intentionally. The generate-visual Edge Function
-- accesses this audit table only through the service-role client.
