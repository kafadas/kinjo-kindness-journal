-- 1) Uniqueness guard so we never double-write the same window
alter table public.reflections
  add constraint reflections_user_period_range_key
  unique (user_id, period, range_start, range_end);

-- 2) Helper: normalize a period token into [start,end) date bounds in user's TZ
create or replace function public.period_bounds(p_period text, p_tz text default 'UTC')
returns table (d_start date, d_end date)
language sql stable as $$
  with now_tz as (
    select (now() at time zone p_tz)::date as today
  )
  select
    case p_period
      when '7d'   then (select today - 6 from now_tz)
      when '30d'  then (select today - 29 from now_tz)
      when '90d'  then (select today - 89 from now_tz)
      when '365d' then (select date_trunc('year', (now() at time zone p_tz))::date from now_tz)
      else (select today - 6 from now_tz)
    end as d_start,
    case p_period
      when '365d' then (select (date_trunc('year', (now() at time zone p_tz)) + interval '1 year')::date from now_tz)
      else (select today + 1 from now_tz)
    end as d_end;
$$;

-- 3) RPC: get or generate (rule-based), always returns a row
create or replace function public.get_or_generate_reflection(p_period text, p_tz text default 'UTC')
returns public.reflections
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_start date; v_end date;
  v_row reflections;
  v_given int; v_received int; v_total int;
  v_top_cat text; v_gap_person text;
  v_model text := 'rule';
begin
  if v_user is null then
    raise exception 'auth.uid() is null';
  end if;

  select d_start, d_end into v_start, v_end from period_bounds(p_period, p_tz);

  -- Try cache first
  select * into v_row
  from reflections
  where user_id = v_user and period = p_period and range_start = v_start and range_end = v_end
  limit 1;

  if found then
    return v_row;
  end if;

  -- Compute quick stats
  select
    coalesce(sum(case when action = 'given' then 1 else 0 end),0),
    coalesce(sum(case when action = 'received' then 1 else 0 end),0)
  into v_given, v_received
  from moments
  where user_id = v_user
    and happened_at >= v_start
    and happened_at < (v_end + 1);

  v_total := v_given + v_received;

  -- Top category in window
  select c.name
  into v_top_cat
  from moments m
  join categories c on c.id = m.category_id
  where m.user_id = v_user
    and m.happened_at >= v_start and m.happened_at < (v_end + 1)
  group by c.name
  order by count(*) desc nulls last
  limit 1;

  -- Person with longest gap (no recent moment)
  select p.display_name
  into v_gap_person
  from people p
  where p.user_id = v_user
  order by coalesce(p.last_recorded_moment_at, timestamp '1970-01-01') asc
  limit 1;

  -- Rule-based copy
  -- (Short, supportive; the UI will embellish per period)
  -- Store machine-readable computed fields in JSON
  insert into reflections
    (user_id, period, range_start, range_end, model, summary, suggestions, computed, regenerated_at)
  values
    (v_user, p_period, v_start, v_end, v_model,
     case
       when v_total = 0 then 'This period was quiet on the kindness front — and that''s okay.'
       when v_top_cat is not null then format('You captured %s moments. Most were in %s.', v_total, v_top_cat)
       else format('You captured %s moments. Keep going — small acts add up.', v_total)
     end,
     case
       when v_gap_person is not null then format('Consider reconnecting with %s this week.', v_gap_person)
       else 'Consider a small check-in with someone you care about.'
     end,
     jsonb_build_object(
       'given', v_given,
       'received', v_received,
       'total', v_total,
       'top_category', coalesce(v_top_cat,''),
       'gap_person', coalesce(v_gap_person,''),
       'period', p_period,
       'start', v_start,
       'end', v_end
     ),
     now()
    )
  returning * into v_row;

  return v_row;
end;
$$;

-- 4) RLS reminder (should already exist). If not, enable and add simple self-only policy:
alter table public.reflections enable row level security;
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='reflections' and policyname='reflections_self'
  ) then
    create policy reflections_self on public.reflections
      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end$$;