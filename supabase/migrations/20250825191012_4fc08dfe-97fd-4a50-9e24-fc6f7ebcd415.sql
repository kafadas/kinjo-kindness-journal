-- Update the generate_reflection_period function to include best streak window for yearly reflections
create or replace function public.generate_reflection_period(p_user uuid, p_period text, p_tz text DEFAULT 'UTC'::text)
returns table(id uuid, user_id uuid, period text, range_start date, range_end date, summary text, suggestions text, computed jsonb, model text, created_at timestamp with time zone, regenerated_at timestamp with time zone)
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_start_date date;
  v_end_date date;
  v_period_days integer;
  v_computed jsonb := '{}'::jsonb;
  v_summary text;
  v_suggestions text;
  v_model text := 'rule';
  v_reflection_id uuid;
  
  -- Common computed fields
  v_total_moments integer;
  v_given_count integer;
  v_received_count integer;
  v_significant_count integer;
  v_active_days integer;
  v_quiet_days integer;
  v_top_categories jsonb;
  v_top_people jsonb;
  v_median_days_between numeric;
  v_latest_highlights jsonb;
  
  -- Period-specific fields
  v_period_specific jsonb := '{}'::jsonb;
begin
  -- Validate period
  if p_period not in ('7d', '30d', '90d', '365d') then
    raise exception 'Invalid period. Must be one of: 7d, 30d, 90d, 365d';
  end if;

  -- Calculate date range based on period
  v_end_date := (current_timestamp at time zone p_tz)::date;
  case p_period
    when '7d' then 
      v_start_date := v_end_date - interval '6 days';
      v_period_days := 7;
    when '30d' then 
      v_start_date := v_end_date - interval '29 days';
      v_period_days := 30;
    when '90d' then 
      v_start_date := v_end_date - interval '89 days';
      v_period_days := 90;
    when '365d' then 
      v_start_date := v_end_date - interval '364 days';
      v_period_days := 365;
  end case;

  -- Compute common fields (keep existing logic)
  select 
    count(*)::integer,
    count(*) filter (where m.action = 'given')::integer,
    count(*) filter (where m.action = 'received')::integer,
    count(*) filter (where m.significance = true)::integer
  into v_total_moments, v_given_count, v_received_count, v_significant_count
  from public.moments m
  where m.user_id = p_user
    and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date;

  -- Active days
  select count(distinct (m.happened_at at time zone p_tz)::date)::integer
  into v_active_days
  from public.moments m
  where m.user_id = p_user
    and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date;

  v_quiet_days := v_period_days - v_active_days;

  -- Top categories (up to 3)
  select jsonb_agg(
    jsonb_build_object(
      'name', cat_data.name,
      'share', cat_data.share,
      'count', cat_data.count
    )
  )
  into v_top_categories
  from (
    select 
      c.name,
      count(*)::integer as count,
      round((count(*)::numeric / greatest(v_total_moments, 1)) * 100, 1) as share
    from public.moments m
    join public.categories c on c.id = m.category_id
    where m.user_id = p_user
      and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
    group by c.id, c.name
    order by count desc
    limit 3
  ) cat_data;

  -- Top people (up to 3)
  select jsonb_agg(
    jsonb_build_object(
      'display_name', people_data.display_name,
      'last_recorded_moment_at', people_data.last_recorded_moment_at
    )
  )
  into v_top_people
  from (
    select 
      p.display_name,
      max(m.happened_at) as last_recorded_moment_at
    from public.moments m
    join public.people p on p.id = m.person_id
    where m.user_id = p_user
      and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
    group by p.id, p.display_name
    order by count(*) desc
    limit 3
  ) people_data;

  -- Median days between moments
  with gaps as (
    select 
      (m.happened_at at time zone p_tz)::date - 
      lag((m.happened_at at time zone p_tz)::date) over (order by m.happened_at) as gap_days
    from public.moments m
    where m.user_id = p_user
      and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
  )
  select coalesce(percentile_cont(0.5) within group (order by gap_days), 0)
  into v_median_days_between
  from gaps where gap_days is not null;

  -- Latest highlights (up to 3 significant moments)
  select jsonb_agg(
    jsonb_build_object(
      'id', highlight_data.id,
      'happened_at', highlight_data.happened_at
    )
  )
  into v_latest_highlights
  from (
    select m.id, m.happened_at
    from public.moments m
    where m.user_id = p_user
      and m.significance = true
      and (m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
    order by m.happened_at desc
    limit 3
  ) highlight_data;

  -- Build common computed fields
  v_computed := jsonb_build_object(
    'total_moments', v_total_moments,
    'given_count', v_given_count,
    'received_count', v_received_count,
    'significant_count', v_significant_count,
    'active_days', v_active_days,
    'quiet_days', v_quiet_days,
    'period_days', v_period_days,
    'top_categories', coalesce(v_top_categories, '[]'::jsonb),
    'top_people', coalesce(v_top_people, '[]'::jsonb),
    'median_days_between', v_median_days_between,
    'latest_highlights', coalesce(v_latest_highlights, '[]'::jsonb)
  );

  -- Period-specific computations
  if p_period = '365d' then
    -- 365d specific fields with best streak window
    with first_moment as (
      select min(fm_m.happened_at)::date as date
      from public.moments fm_m
      where fm_m.user_id = p_user
    ),
    best_streak_data as (
      select bsw.streak, bsw.d_start, bsw.d_end 
      from public.best_streak_window(p_user, v_start_date, v_end_date) bsw
    ),
    monthly_counts as (
      select 
        to_char((mc_m.happened_at at time zone p_tz), 'Month') as month_name,
        count(*) as count
      from public.moments mc_m
      where mc_m.user_id = p_user
        and (mc_m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
      group by to_char((mc_m.happened_at at time zone p_tz), 'Month')
    ),
    kindest_month as (
      select trim(mc.month_name) as month_name 
      from monthly_counts mc 
      order by mc.count desc 
      limit 1
    ),
    top_connections as (
      select tc_p.display_name, count(*) as shared_count
      from public.moments tc_m
      join public.people tc_p on tc_p.id = tc_m.person_id
      where tc_m.user_id = p_user
        and (tc_m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
      group by tc_p.id, tc_p.display_name
      order by shared_count desc
      limit 5
    )
    select jsonb_build_object(
      'milestones', jsonb_build_object(
        'first_moment_date', fm.date,
        'best_streak', bsd.streak,
        'best_streak_start', bsd.d_start,
        'best_streak_end', bsd.d_end,
        'kindest_month', coalesce((select km.month_name from kindest_month km), 'None')
      ),
      'seasonality', coalesce((select km.month_name from kindest_month km), 'None'),
      'top_connections', coalesce(array_agg(jsonb_build_object('display_name', tc.display_name, 'shared_count', tc.shared_count)), array[]::jsonb[])
    )
    into v_period_specific
    from first_moment fm, best_streak_data bsd
    left join top_connections tc on true
    group by fm.date, bsd.streak, bsd.d_start, bsd.d_end;
  
  elsif p_period = '7d' then
    -- 7d specific fields (keeping existing logic)
    with current_streak as (
      select cs.current, cs.best 
      from public.compute_streak(p_user) cs
    ),
    last_week_moments as (
      select count(*)::integer as count
      from public.moments lw_m
      where lw_m.user_id = p_user
        and (lw_m.happened_at at time zone p_tz)::date between (v_start_date - interval '7 days')::date and (v_end_date - interval '7 days')::date
    ),
    weekday_activity as (
      select 
        extract(dow from (wa_m.happened_at at time zone p_tz)) as dow,
        to_char((wa_m.happened_at at time zone p_tz), 'Day') as day_name,
        count(*) as count
      from public.moments wa_m
      where wa_m.user_id = p_user
        and (wa_m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
      group by extract(dow from (wa_m.happened_at at time zone p_tz)), to_char((wa_m.happened_at at time zone p_tz), 'Day')
    ),
    most_active as (
      select trim(wa.day_name) as day_name 
      from weekday_activity wa 
      order by wa.count desc 
      limit 1
    ),
    quietest_active as (
      select trim(wa.day_name) as day_name 
      from weekday_activity wa 
      order by wa.count asc 
      limit 1
    )
    select jsonb_build_object(
      'streak_delta', v_total_moments - lw.count,
      'most_active_day_of_week', coalesce((select ma.day_name from most_active ma), 'None'),
      'quietest_day_of_week', coalesce((select qa.day_name from quietest_active qa), 'None')
    )
    into v_period_specific
    from current_streak cs, last_week_moments lw;

  elsif p_period = '30d' then
    -- 30d specific fields (keeping existing logic) 
    with weekly_counts as (
      select 
        extract(week from (wc_m.happened_at at time zone p_tz)) as week_num,
        count(*) as count
      from public.moments wc_m
      where wc_m.user_id = p_user
        and (wc_m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
      group by extract(week from (wc_m.happened_at at time zone p_tz))
      order by extract(week from (wc_m.happened_at at time zone p_tz)) desc
      limit 4
    ),
    new_people as (
      select count(distinct np_p.id)::integer as count
      from public.people np_p
      where np_p.user_id = p_user
        and np_p.created_at::date between v_start_date and v_end_date
    ),
    consistency as (
      select 
        case 
          when v_active_days = 0 then 0
          else round(((v_active_days::numeric / v_period_days) * 100), 0)
        end as score
    )
    select jsonb_build_object(
      'week_to_week_change_pct', coalesce(array_agg(wc.count order by wc.week_num desc), array[]::integer[]),
      'consistency_score', c.score,
      'new_people_count', np.count
    )
    into v_period_specific
    from weekly_counts wc, new_people np, consistency c
    group by c.score, np.count;

  elsif p_period = '90d' then
    -- 90d specific fields (keeping existing logic)
    with top_tags as (
      select tag, count(*) as count
      from public.moments tt_m, unnest(tt_m.tags) as tag
      where tt_m.user_id = p_user
        and (tt_m.happened_at at time zone p_tz)::date between v_start_date and v_end_date
      group by tag
      order by count desc
      limit 3
    )
    select jsonb_build_object(
      'shifting_categories', '[]'::jsonb,
      'longest_gap_closed', null,
      'tags_top', coalesce(array_agg(tt.tag), array[]::text[])
    )
    into v_period_specific
    from top_tags tt;
  end if;

  -- Merge period-specific fields into computed
  v_computed := v_computed || v_period_specific;

  -- Generate summary and suggestions (rule-based fallback for now)
  case p_period
    when '7d' then 
      v_summary := format('This week you recorded %s moments of kindness. You were active on %s days, with %s moments given and %s received.',
        v_total_moments, v_active_days, v_given_count, v_received_count);
      v_suggestions := 'Consider reaching out to someone you haven''t connected with recently, or try a small act of kindness tomorrow.';
    when '30d' then
      v_summary := format('Over the past month, you captured %s moments across %s active days. Your kindness balance shows %s given and %s received.',
        v_total_moments, v_active_days, v_given_count, v_received_count);
      v_suggestions := 'Reflect on patterns you notice and consider expanding kindness into new areas of your life.';
    when '90d' then
      v_summary := format('In the past quarter, you documented %s moments of kindness over %s days. This includes %s significant moments worth remembering.',
        v_total_moments, v_active_days, v_significant_count);
      v_suggestions := 'Look for opportunities to deepen existing connections and explore new ways to show kindness.';
    when '365d' then
      v_summary := format('Over the past year, you''ve captured %s moments of kindness across %s active days - a beautiful record of your caring nature.',
        v_total_moments, v_active_days);
      v_suggestions := 'Take time to appreciate how far you''ve come and set gentle intentions for continued growth in kindness.';
  end case;

  -- Upsert reflection
  insert into public.reflections (
    user_id, period, range_start, range_end, summary, suggestions, computed, model, regenerated_at
  )
  values (
    p_user, p_period, v_start_date, v_end_date, v_summary, v_suggestions, v_computed, v_model, now()
  )
  on conflict (user_id, period, range_start, range_end)
  do update set
    summary = excluded.summary,
    suggestions = excluded.suggestions,
    computed = excluded.computed,
    model = excluded.model,
    regenerated_at = excluded.regenerated_at
  returning id into v_reflection_id;

  -- Return the full row
  return query
  select r.id, r.user_id, r.period, r.range_start, r.range_end, 
         r.summary, r.suggestions, r.computed, r.model, r.created_at, r.regenerated_at
  from public.reflections r
  where r.id = v_reflection_id;
end;
$function$;