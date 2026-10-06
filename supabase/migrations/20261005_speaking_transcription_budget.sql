-- Applied to production on 5 October 2026.
-- It records speaking-transcription attempts so the £5 monthly ceiling can be
-- reserved before OpenAI is called. Clients have no access.

create table if not exists public.speaking_transcription_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  estimated_cost_gbp numeric(10,4) not null,
  audio_bytes integer not null,
  status text not null,
  constraint speaking_transcription_log_cost_check check (estimated_cost_gbp > 0 and estimated_cost_gbp <= 0.02),
  constraint speaking_transcription_log_bytes_check check (audio_bytes > 0 and audio_bytes <= 600000),
  constraint speaking_transcription_log_status_check check (status in ('reserved', 'succeeded', 'failed'))
);

create index if not exists speaking_transcription_log_user_created_idx
  on public.speaking_transcription_log (user_id, created_at desc);

alter table public.speaking_transcription_log enable row level security;

revoke all on table public.speaking_transcription_log from public;
revoke all on table public.speaking_transcription_log from anon;
revoke all on table public.speaking_transcription_log from authenticated;

create or replace function public.reserve_speaking_transcription(
  p_user_id uuid,
  p_audio_bytes integer,
  p_estimated_cost_gbp numeric,
  p_monthly_budget_gbp numeric
)
returns table (
  attempt_id uuid,
  allowed boolean,
  reason text,
  used_cost_gbp numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_month_start timestamptz := date_trunc('month', timezone('UTC', now())) at time zone 'UTC';
  v_used_cost numeric := 0;
  v_attempt_id uuid;
begin
  if p_user_id is null
     or p_audio_bytes is null
     or p_audio_bytes <= 0
     or p_audio_bytes > 600000
     or p_estimated_cost_gbp is null
     or p_estimated_cost_gbp <= 0
     or p_estimated_cost_gbp > 0.02
     or p_monthly_budget_gbp is null
     or p_monthly_budget_gbp <= 0
     or p_monthly_budget_gbp > 5 then
    return query select null::uuid, false, 'invalid-budget-config', 0::numeric;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended('speaking-transcription:' || p_user_id::text, 0));

  select coalesce(sum(greatest(estimated_cost_gbp, 0)), 0)
    into v_used_cost
    from public.speaking_transcription_log
   where user_id = p_user_id
     and created_at >= v_month_start;

  if v_used_cost + p_estimated_cost_gbp > p_monthly_budget_gbp then
    return query select null::uuid, false, 'monthly-cost-ceiling-reached', v_used_cost;
    return;
  end if;

  insert into public.speaking_transcription_log (user_id, estimated_cost_gbp, audio_bytes, status)
  values (p_user_id, p_estimated_cost_gbp, p_audio_bytes, 'reserved')
  returning id into v_attempt_id;

  return query
    select v_attempt_id, true, 'reserved', v_used_cost + p_estimated_cost_gbp;
end;
$$;

create or replace function public.finish_speaking_transcription(
  p_attempt_id uuid,
  p_user_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('succeeded', 'failed') then
    raise exception 'invalid speaking transcription status';
  end if;
  update public.speaking_transcription_log
     set status = p_status
   where id = p_attempt_id
     and user_id = p_user_id
     and status = 'reserved';
end;
$$;

revoke all on function public.reserve_speaking_transcription(uuid, integer, numeric, numeric) from public;
revoke all on function public.reserve_speaking_transcription(uuid, integer, numeric, numeric) from anon;
revoke all on function public.reserve_speaking_transcription(uuid, integer, numeric, numeric) from authenticated;
grant execute on function public.reserve_speaking_transcription(uuid, integer, numeric, numeric) to service_role;

revoke all on function public.finish_speaking_transcription(uuid, uuid, text) from public;
revoke all on function public.finish_speaking_transcription(uuid, uuid, text) from anon;
revoke all on function public.finish_speaking_transcription(uuid, uuid, text) from authenticated;
grant execute on function public.finish_speaking_transcription(uuid, uuid, text) to service_role;
