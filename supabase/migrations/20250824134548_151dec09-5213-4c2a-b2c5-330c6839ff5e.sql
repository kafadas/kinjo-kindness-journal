-- Helper function to get user timezone from profiles
create or replace function public.user_tz(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select timezone from public.profiles where user_id = p_user), 'UTC');
$$;

-- Drop existing overloaded functions to avoid ambiguity
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean, text);
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);

-- Create deterministic daily counts function
create or replace function public.daily_moment_counts(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,                -- 'given' | 'received' | 'both'
  p_significant_only boolean,
  p_tz text                     -- pass explicit timezone; caller can send public.user_tz(...)
)
returns table(
  day date,
  given_count int,
  received_count int,
  total_count int
)
language sql
stable
security definer
set search_path = public
as $func$
  with base as (
    select
      (happened_at at time zone p_tz)::date as d,
      case when action = 'given' then 1 else 0 end as g,
      case when action = 'received' then 1 else 0 end as r
    from public.moments
    where user_id = p_user
      and (happened_at at time zone p_tz)::date >= p_start
      and (happened_at at time zone p_tz)::date <= p_end
      and (p_action = 'both' or action::text = p_action)
      and (not p_significant_only or significance is true)
  )
  select
    d as day,
    sum(g)::int as given_count,
    sum(r)::int as received_count,
    (sum(g)+sum(r))::int as total_count
  from base
  group by d
  order by d;
$func$;

-- Drop existing category share delta function
drop function if exists public.category_share_delta(uuid, date, date, text, boolean, text);

-- Create deterministic category share delta function
create or replace function public.category_share_delta(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,                -- 'given' | 'received' | 'both'
  p_significant_only boolean,
  p_tz text
)
returns table(
  category_id uuid,
  category_name text,
  count int,
  pct numeric
)
language sql
stable
security definer
set search_path = public
as $func$
  with b as (
    select
      category_id,
      (happened_at at time zone p_tz)::date as d
    from public.moments
    where user_id = p_user
      and (happened_at at time zone p_tz)::date >= p_start
      and (happened_at at time zone p_tz)::date <= p_end
      and (p_action = 'both' or action::text = p_action)
      and (not p_significant_only or significance is true)
  ),
  counts as (
    select category_id, count(*)::int as c
    from b
    group by category_id
  ),
  total as (
    select greatest(sum(c),1)::numeric as t from counts
  )
  select
    c.category_id,
    (select name from public.categories where id = c.category_id) as category_name,
    c.c as count,
    round((c.c::numeric / (select t from total))*100, 1) as pct
  from counts c
  order by c.c desc nulls last;
$func$;

-- Verification query
select * from public.daily_moment_counts(auth.uid(), current_date - 10, current_date, 'both', false, public.user_tz(auth.uid())) limit 5;