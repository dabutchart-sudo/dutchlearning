alter table public.visual_generation_log
  add column if not exists storage_path text;

alter table public.visual_generation_log
  drop constraint if exists visual_generation_log_status_check;

alter table public.visual_generation_log
  add constraint visual_generation_log_status_check
  check (status in ('reserved','awaiting_review','succeeded','rejected','failed'));

drop index if exists public.visual_generation_log_one_reserved_card_idx;

create unique index if not exists visual_generation_log_one_active_card_idx
  on public.visual_generation_log (card_id)
  where status in ('reserved','awaiting_review');
