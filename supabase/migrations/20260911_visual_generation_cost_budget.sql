alter table public.visual_generation_log
  add column if not exists estimated_cost_gbp numeric(10,4) not null default 0;

alter table public.visual_generation_log
  drop constraint if exists visual_generation_log_estimated_cost_gbp_check;

alter table public.visual_generation_log
  add constraint visual_generation_log_estimated_cost_gbp_check
  check (estimated_cost_gbp >= 0);
