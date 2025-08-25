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
    v_cached_total := coalesce((v_row.computed->>'total')::int, 0);
    
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