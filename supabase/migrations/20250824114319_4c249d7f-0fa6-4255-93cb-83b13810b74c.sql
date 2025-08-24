-- 1) Drop ALL prior overloads explicitly (both arities)
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean, text);

-- 2) Create ONE canonical function (with p_tz)
create or replace function public.daily_moment_counts(
  p_user uuid,
  p_start date default null,
  p_end   date default null,
  p_action text default 'both',          -- 'both'|'given'|'received'
  p_significant_only boolean default false,
  p_tz text default 'UTC'
)
returns table(d date, total int, given int, received int)
language sql security definer
set search_path = public
as $$
  with bounds as (
    select
      coalesce(p_start, (select min(timezone(p_tz, happened_at))::date from moments where user_id=p_user)) as s,
      coalesce(p_end,   (select max(timezone(p_tz, happened_at))::date from moments where user_id=p_user)) as e
  ),
  days as (
    select generate_series((select s from bounds),(select e from bounds),'1 day')::date d
  ),
  base as (
    select
      timezone(p_tz, m.happened_at)::date as d,
      m.action,
      m.significance
    from moments m
    where m.user_id = p_user
      and (p_start is null or timezone(p_tz, m.happened_at)::date >= p_start)
      and (p_end   is null or timezone(p_tz, m.happened_at)::date <= p_end)
      and (p_action = 'both' or m.action::text = p_action)
      and (not p_significant_only or m.significance is true)
  )
  select
    d.d,
    coalesce(sum((b.action is not null)::int),0)                 as total,
    coalesce(sum((b.action = 'given')::int),0)                   as given,
    coalesce(sum((b.action = 'received')::int),0)                as received
  from days d
  left join base b on b.d = d.d
  group by d.d
  order by d.d;
$$;

-- (Optional helpers used elsewhere; safe to (re)create)
drop function if exists public.user_moment_bounds(uuid, text);
create or replace function public.user_moment_bounds(p_user uuid, p_tz text default 'UTC')
returns table(min_date date, max_date date)
language sql security definer
set search_path = public
as $$
  select
    min(timezone(p_tz, happened_at))::date,
    max(timezone(p_tz, happened_at))::date
  from moments
  where user_id = p_user;
$$;