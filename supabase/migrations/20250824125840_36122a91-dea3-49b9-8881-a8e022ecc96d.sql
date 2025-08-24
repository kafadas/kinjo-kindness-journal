-- Drop old overloads (if they exist)
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean, text);

-- Create one function with a default timezone, returning day buckets in the user's local time
create or replace function public.daily_moment_counts(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,                  -- 'given' | 'received' | 'both'
  p_significant_only boolean,
  p_tz text default 'UTC'
)
returns table(
  day date,
  given int,
  received int,
  total int
)
language sql
security definer
set search_path = public
as $$
with base as (
  select
    (happened_at at time zone p_tz)::date as d,
    case when action = 'given' then 1 else 0 end as g,
    case when action = 'received' then 1 else 0 end as r
  from moments
  where user_id = p_user
    and (p_start is null or (happened_at at time zone p_tz)::date >= p_start)
    and (p_end   is null or (happened_at at time zone p_tz)::date <= p_end)
    and (p_action = 'both' or action = p_action::action_t)
    and (not p_significant_only or significance is true)
)
select
  d as day,
  sum(g)::int as given,
  sum(r)::int as received,
  (sum(g)+sum(r))::int as total
from base
group by d
order by d;
$$;

-- Grant execute so the anon key can call via RPC
grant execute on function public.daily_moment_counts(uuid, date, date, text, boolean, text) to anon, authenticated;

-- Add a tiny companion function for the category breakdown so we can filter by significant‑only and action consistently
create or replace function public.category_share_counts(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text,
  p_significant_only boolean
)
returns table(category_id uuid, name text, count int)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name, count(*)::int
  from moments m
  join categories c on c.id = m.category_id
  where m.user_id = p_user
    and (p_start is null or (m.happened_at)::date >= p_start)
    and (p_end   is null or (m.happened_at)::date <= p_end)
    and (p_action = 'both' or m.action = p_action::action_t)
    and (not p_significant_only or m.significance is true)
  group by c.id, c.name
  order by count desc;
$$;
grant execute on function public.category_share_counts(uuid, date, date, text, boolean) to anon, authenticated;