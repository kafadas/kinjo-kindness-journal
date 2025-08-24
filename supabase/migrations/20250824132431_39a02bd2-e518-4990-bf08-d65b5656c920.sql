-- 1) Clean up any ambiguous overloads
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean, text);
drop function if exists public.category_share_delta(uuid, date, date, text, boolean);
drop function if exists public.category_share_delta(uuid, date, date, text, boolean, text);

-- 2) Canonical enum cast helper (safely cast text to action_t, allowing 'both')
create or replace function public._action_from_text(p_action text)
returns action_t
language sql immutable as $$
  select case lower(coalesce(p_action,'both'))
           when 'given' then 'given'::action_t
           when 'received' then 'received'::action_t
           else null
         end;
$$;

-- 3) Daily counts, timezone-aware, unambiguous signature
create or replace function public.daily_moment_counts_v1(
  p_user uuid,
  p_start date,
  p_end date,
  p_action text,             -- 'given' | 'received' | 'both'
  p_significant_only boolean,
  p_tz text                  -- e.g. 'Europe/London', 'America/New_York', 'UTC'
)
returns table (
  d date,
  given_count int,
  received_count int,
  total int
)
language sql stable as $$
  with series as (
    select generate_series(p_start, p_end, interval '1 day')::date as d
  ),
  base as (
    select
      -- bucket happened_at by user tz to a DATE
      (happened_at at time zone p_tz)::date as day_local,
      action,
      significance
    from public.moments
    where user_id = p_user
      and ( _action_from_text(p_action) is null  -- 'both'
            or action = _action_from_text(p_action) )
      and (not p_significant_only or significance is true)
      and ( (happened_at at time zone p_tz)::date between p_start and p_end )
  ),
  agg as (
    select
      day_local as d,
      count(*) filter (where action = 'given')    as given_count,
      count(*) filter (where action = 'received') as received_count,
      count(*)                                     as total
    from base
    group by 1
  )
  select s.d,
         coalesce(a.given_count,0)    as given_count,
         coalesce(a.received_count,0) as received_count,
         coalesce(a.total,0)          as total
  from series s
  left join agg a on a.d = s.d
  order by s.d;
$$;

comment on function public.daily_moment_counts_v1(uuid, date, date, text, boolean, text)
  is 'Timezone-aware (bucket by p_tz). p_action: given|received|both. Inclusive p_start..p_end.';

-- 4) Category share within range, timezone-aware
create or replace function public.category_share_delta_v1(
  p_user uuid,
  p_start date,
  p_end date,
  p_action text,             -- 'given' | 'received' | 'both'
  p_significant_only boolean,
  p_tz text
)
returns table (
  category_id uuid,
  category_name text,
  cnt int,
  pct numeric
)
language sql stable as $$
  with base as (
    select
      category_id,
      (happened_at at time zone p_tz)::date as day_local
    from public.moments
    where user_id = p_user
      and ( _action_from_text(p_action) is null or action = _action_from_text(p_action) )
      and (not p_significant_only or significance is true)
      and ( (happened_at at time zone p_tz)::date between p_start and p_end )
  ),
  counts as (
    select category_id, count(*)::int as cnt
    from base
    group by 1
  ),
  total as (
    select greatest(sum(cnt),0)::numeric as total_cnt
    from counts
  )
  select
    c.category_id,
    cat.name as category_name,
    c.cnt,
    case when t.total_cnt > 0 then round( (c.cnt::numeric * 100.0) / t.total_cnt, 1 ) else 0 end as pct
  from counts c
  join public.categories cat on cat.id = c.category_id
  cross join total t
  order by c.cnt desc, category_name asc;
$$;

comment on function public.category_share_delta_v1(uuid, date, date, text, boolean, text)
  is 'Category distribution for the range, timezone-aware and significance/action aware. Returns pct rounded to 1 dp.';

-- 5) Helpful index for date-bounded queries (already likely present; keep idempotent)
create index if not exists idx_moments_user_happened_at
  on public.moments (user_id, happened_at);