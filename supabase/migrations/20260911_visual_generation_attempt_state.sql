alter table public.visual_generation_log
  add column if not exists status text,
  add column if not exists failure_reason text,
  add column if not exists completed_at timestamptz;

update public.visual_generation_log
set status = case when image_url is not null then 'succeeded' else 'failed' end
where status is null;

alter table public.visual_generation_log
  alter column status set default 'reserved',
  alter column status set not null;

alter table public.visual_generation_log
  drop constraint if exists visual_generation_log_status_check;

alter table public.visual_generation_log
  add constraint visual_generation_log_status_check
  check (status in ('reserved','succeeded','failed'));

create unique index if not exists visual_generation_log_one_reserved_card_idx
  on public.visual_generation_log (card_id)
  where status = 'reserved';
