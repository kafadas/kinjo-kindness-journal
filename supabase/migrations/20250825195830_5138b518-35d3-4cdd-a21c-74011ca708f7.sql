CREATE OR REPLACE FUNCTION public.get_or_generate_reflection(p_period text, p_tz text DEFAULT 'UTC'::text)
 RETURNS reflections
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_start date; v_end date;
  v_row reflections;
  v_given int; v_received int; v_total int;
  v_top_cat text; v_gap_person text;
  v_model text := 'rule';
  v_cached_total int := 0;
  v_current_total int := 0;
  v_computed jsonb := '{}'::jsonb;
  v_daily_weekday_data jsonb := '[]'::jsonb;
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
    -- Check if cache is still valid by comparing moment counts
    v_cached_total := coalesce((v_row.computed->>'total_moments')::int, (v_row.computed->>'total')::int, 0);
    
    -- Count current moments in the same date range using timezone-aware logic
    select count(*)::int
    into v_current_total
    from moments
    where user_id = v_user
      and public.moment_date_local(happened_at, p_tz) between v_start and v_end;
    
    -- If counts match, return cached result
    if v_cached_total = v_current_total then
      return v_row;
    end if;
    
    -- Cache is stale, continue to regenerate
  end if;

  -- Compute quick stats using timezone-aware date filtering
  select
    coalesce(sum(case when action = 'given' then 1 else 0 end),0),
    coalesce(sum(case when action = 'received' then 1 else 0 end),0)
  into v_given, v_received
  from moments
  where user_id = v_user
    and public.moment_date_local(happened_at, p_tz) between v_start and v_end;

  v_total := v_given + v_received;

  -- Top category in window
  select c.name
  into v_top_cat
  from moments m
  join categories c on c.id = m.category_id
  where m.user_id = v_user
    and public.moment_date_local(m.happened_at, p_tz) between v_start and v_end
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

  -- For 7d period, generate daily weekday breakdown
  if p_period = '7d' then
    with weekday_activity as (
      select 
        extract(isodow from public.moment_date_local(wa_m.happened_at, p_tz)) as dow, -- 1=Monday, 7=Sunday
        count(*) as total_count,
        count(*) filter (where wa_m.action = 'given') as given_count,
        count(*) filter (where wa_m.action = 'received') as received_count
      from moments wa_m
      where wa_m.user_id = v_user
        and public.moment_date_local(wa_m.happened_at, p_tz) between v_start and v_end
      group by extract(isodow from public.moment_date_local(wa_m.happened_at, p_tz))
    )
    select array[
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 1), '{"total":0,"given":0,"received":0}'::jsonb), -- Monday
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 2), '{"total":0,"given":0,"received":0}'::jsonb), -- Tuesday  
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 3), '{"total":0,"given":0,"received":0}'::jsonb), -- Wednesday
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 4), '{"total":0,"given":0,"received":0}'::jsonb), -- Thursday
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 5), '{"total":0,"given":0,"received":0}'::jsonb), -- Friday
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 6), '{"total":0,"given":0,"received":0}'::jsonb), -- Saturday
      coalesce((select jsonb_build_object('total', wa.total_count, 'given', wa.given_count, 'received', wa.received_count) from weekday_activity wa where wa.dow = 7), '{"total":0,"given":0,"received":0}'::jsonb)  -- Sunday
    ]
    into v_daily_weekday_data;
  end if;

  -- Build computed object with UI-expected field names
  v_computed := jsonb_build_object(
    'given', v_given,
    'received', v_received,
    'total', v_total,
    'given_count', v_given,  -- UI expects this field name
    'received_count', v_received,  -- UI expects this field name
    'total_moments', v_total,  -- UI expects this field name
    'top_category', coalesce(v_top_cat,''),
    'gap_person', coalesce(v_gap_person,''),
    'period', p_period,
    'start', v_start,
    'end', v_end
  );

  -- Add period-specific data
  if p_period = '7d' then
    v_computed := v_computed || jsonb_build_object('daily_by_weekday', v_daily_weekday_data);
  end if;

  -- Rule-based copy
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
     v_computed,
     now()
    )
  on conflict (user_id, period, range_start, range_end)
  do update set
    summary = excluded.summary,
    suggestions = excluded.suggestions,
    computed = excluded.computed,
    model = excluded.model,
    regenerated_at = excluded.regenerated_at
  returning * into v_row;

  return v_row;
end;
$function$