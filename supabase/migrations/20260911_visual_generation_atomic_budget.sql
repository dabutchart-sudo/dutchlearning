create or replace function public.reserve_visual_generation(
  p_user_id uuid,
  p_card_id bigint,
  p_model text,
  p_estimated_cost_gbp numeric,
  p_daily_limit integer,
  p_monthly_limit integer,
  p_monthly_budget_gbp numeric
)
returns table (
  attempt_id uuid,
  allowed boolean,
  reason text,
  used_today integer,
  used_month integer,
  used_cost_gbp numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_day_start timestamptz := date_trunc('day', timezone('UTC', now())) at time zone 'UTC';
  v_month_start timestamptz := date_trunc('month', timezone('UTC', now())) at time zone 'UTC';
  v_used_today integer := 0;
  v_used_month integer := 0;
  v_used_cost numeric := 0;
  v_attempt_id uuid;
begin
  if p_user_id is null
     or p_card_id is null
     or p_card_id <= 0
     or coalesce(trim(p_model), '') = ''
     or p_estimated_cost_gbp is null
     or p_estimated_cost_gbp <= 0
     or p_daily_limit is null
     or p_daily_limit <= 0
     or p_monthly_limit is null
     or p_monthly_limit <= 0
     or p_monthly_budget_gbp is null
     or p_monthly_budget_gbp <= 0 then
    return query select null::uuid, false, 'invalid-budget-config', 0, 0, 0::numeric;
    return;
  end if;

  -- Serialize all reservations for one authenticated user so two different cards
  -- cannot both pass the same daily/monthly/GBP budget check concurrently.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select count(*)::integer
    into v_used_today
    from public.visual_generation_log
   where user_id = p_user_id
     and created_at >= v_day_start;

  select count(*)::integer,
         coalesce(sum(greatest(estimated_cost_gbp, 0)), 0)
    into v_used_month, v_used_cost
    from public.visual_generation_log
   where user_id = p_user_id
     and created_at >= v_month_start;

  if exists (
    select 1
      from public.visual_generation_log
     where card_id = p_card_id
       and status in ('reserved', 'awaiting_review')
  ) then
    return query select null::uuid, false, 'active-card', v_used_today, v_used_month, v_used_cost;
    return;
  end if;

  if v_used_today >= p_daily_limit then
    return query select null::uuid, false, 'daily-limit-reached', v_used_today, v_used_month, v_used_cost;
    return;
  end if;

  if v_used_month >= p_monthly_limit then
    return query select null::uuid, false, 'monthly-limit-reached', v_used_today, v_used_month, v_used_cost;
    return;
  end if;

  if v_used_cost + p_estimated_cost_gbp > p_monthly_budget_gbp then
    return query select null::uuid, false, 'monthly-cost-ceiling-reached', v_used_today, v_used_month, v_used_cost;
    return;
  end if;

  begin
    insert into public.visual_generation_log (
      user_id,
      card_id,
      model,
      estimated_cost_gbp,
      status
    ) values (
      p_user_id,
      p_card_id,
      p_model,
      p_estimated_cost_gbp,
      'reserved'
    ) returning id into v_attempt_id;
  exception when unique_violation then
    return query select null::uuid, false, 'active-card', v_used_today, v_used_month, v_used_cost;
    return;
  end;

  return query
    select v_attempt_id,
           true,
           'reserved',
           v_used_today + 1,
           v_used_month + 1,
           v_used_cost + p_estimated_cost_gbp;
end;
$$;

revoke all on function public.reserve_visual_generation(uuid,bigint,text,numeric,integer,integer,numeric) from public;
revoke all on function public.reserve_visual_generation(uuid,bigint,text,numeric,integer,integer,numeric) from anon;
revoke all on function public.reserve_visual_generation(uuid,bigint,text,numeric,integer,integer,numeric) from authenticated;
grant execute on function public.reserve_visual_generation(uuid,bigint,text,numeric,integer,integer,numeric) to service_role;
