-- 1) Clean up any old overloads that cause ambiguity
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean, text);
drop function if exists public.daily_moment_counts(p_user uuid, p_start date, p_end date, p_action text, p_significant_only boolean);
drop function if exists public.category_share_delta(uuid, date, date, text, boolean);
drop function if exists public.category_share_delta(uuid, date, date, text, boolean, text);

-- 2) Canonical daily counts function (handles ALL via NULL start/end, timezone-safe)
create or replace function public.daily_moment_counts(
  p_user uuid,
  p_start date default null,
  p_end   date default null,
  p_action text default 'both',
  p_significant_only boolean default false,
  p_tz text default 'UTC'
)
returns table(
  d date,
  given int,
  received int,
  total int
)
language sql
stable
security definer
set search_path = 'public'
as $$
with bounds as (
  select
    coalesce(
      p_start,
      (select min((m.happened_at at time zone p_tz)::date) from public.moments m where m.user_id = p_user),
      current_date
    )::date as start_d,
    coalesce(p_end, current_date)::date as end_d
),
days as (
  select generate_series((select start_d from bounds), (select end_d from bounds), interval '1 day')::date as d
),
base as (
  select
    (m.happened_at at time zone p_tz)::date as d,
    m.action,
    count(*) as c
  from public.moments m
  where m.user_id = p_user
    and (
      p_start is null and p_end is null
      or ( (m.happened_at at time zone p_tz)::date between (select start_d from bounds) and (select end_d from bounds) )
    )
    and (case when p_action = 'both' then true else m.action = p_action::public.action_t end)
    and (not p_significant_only or m.significance is true)
  group by 1,2
)
select
  d.d,
  coalesce(sum(case when base.action = 'given' then base.c end), 0)::int as given,
  coalesce(sum(case when base.action = 'received' then base.c end), 0)::int as received,
  coalesce(sum(base.c),0)::int as total
from days d
left join base on base.d = d.d
group by d.d
order by d.d;
$$;

-- 3) Canonical category share (uses same tz + action/significant filters, no overloads)
create or replace function public.category_share_delta(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text default 'both',
  p_significant_only boolean default false,
  p_tz text default 'UTC'
)
returns table(
  category_id uuid,
  category_name text,
  cnt int,
  pct numeric
)
language sql
stable
security definer
set search_path = 'public'
as $$
with filtered as (
  select m.category_id
  from public.moments m
  where m.user_id = p_user
    and (m.happened_at at time zone p_tz)::date between p_start and p_end
    and (case when p_action = 'both' then true else m.action = p_action::public.action_t end)
    and (not p_significant_only or m.significance is true)
),
totals as (
  select count(*) as total from filtered
)
select
  c.id,
  c.name,
  coalesce(count(f.category_id),0)::int as cnt,
  case when (select total from totals) > 0
       then round(100.0 * coalesce(count(f.category_id),0) / (select total from totals), 1)
       else 0 end as pct
from public.categories c
left join filtered f on f.category_id = c.id
where c.user_id = p_user
group by c.id, c.name, (select total from totals)
order by cnt desc, c.name;
$$;