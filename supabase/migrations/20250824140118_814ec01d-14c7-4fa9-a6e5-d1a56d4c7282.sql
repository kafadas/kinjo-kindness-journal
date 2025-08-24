-- Fix security warnings by adding search_path to the new functions
CREATE OR REPLACE FUNCTION public.daily_moment_counts_v1(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,
  p_significant_only boolean,
  p_tz    text
)
returns table(
  d date,
  given_count int,
  received_count int,
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
      (select min((m.happened_at at time zone p_tz)::date) from public.moments m where m.user_id = p_user)
    ) as s,
    coalesce(
      p_end,
      (current_timestamp at time zone p_tz)::date
    ) as e
),
days as (
  select generate_series((select s from bounds), (select e from bounds), interval '1 day')::date as d
),
base as (
  select
    (m.happened_at at time zone p_tz)::date as d,
    m.action,
    count(*) as c
  from public.moments m
  where m.user_id = p_user
    and (p_significant_only is false or m.significance is true)
    and (p_action = 'both' or m.action = p_action::public.action_t)
    and (m.happened_at at time zone p_tz)::date between (select s from bounds) and (select e from bounds)
  group by 1,2
)
select
  d,
  coalesce(sum(case when action = 'given' then c end), 0)::int    as given_count,
  coalesce(sum(case when action = 'received' then c end), 0)::int as received_count,
  coalesce(sum(c), 0)::int                                        as total
from days
left join base using (d)
group by d
order by d;
$$;

CREATE OR REPLACE FUNCTION public.category_share_delta_v1(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,
  p_significant_only boolean,
  p_tz    text
)
returns table(
  category_id uuid,
  name text,
  cnt int,
  share numeric
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
      (select min((m.happened_at at time zone p_tz)::date) from public.moments m where m.user_id = p_user)
    ) as s,
    coalesce(
      p_end,
      (current_timestamp at time zone p_tz)::date
    ) as e
),
filtered as (
  select
    m.category_id,
    count(*) as cnt
  from public.moments m
  where m.user_id = p_user
    and (p_significant_only is false or m.significance is true)
    and (p_action = 'both' or m.action = p_action::public.action_t)
    and (m.happened_at at time zone p_tz)::date between (select s from bounds) and (select e from bounds)
  group by 1
),
total as (
  select greatest(sum(cnt), 1) as t from filtered
)
select
  c.id as category_id,
  c.name,
  coalesce(f.cnt, 0) as cnt,
  round( (coalesce(f.cnt,0)::numeric / (select t from total)) * 100, 1) as share
from public.categories c
left join filtered f on f.category_id = c.id
where c.user_id = p_user
order by share desc, name asc;
$$;