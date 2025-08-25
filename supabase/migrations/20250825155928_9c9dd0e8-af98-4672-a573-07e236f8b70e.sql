-- Fix ambiguous column references in generate_reflection_period function
CREATE OR REPLACE FUNCTION public.generate_reflection_period(
  p_user uuid, 
  p_period text, 
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  period text,
  range_start date,
  range_end date,
  summary text,
  suggestions text,
  computed jsonb,
  model text,
  created_at timestamptz,
  regenerated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
BEGIN
  -- Validate period
  IF p_period NOT IN ('7d', '30d', '90d', '365d') THEN
    RAISE EXCEPTION 'Invalid period. Must be one of: 7d, 30d, 90d, 365d';
  END IF;

  -- Calculate date range based on period
  v_end_date := (current_timestamp AT TIME ZONE p_tz)::date;
  CASE p_period
    WHEN '7d' THEN 
      v_start_date := v_end_date - interval '6 days';
      v_period_days := 7;
    WHEN '30d' THEN 
      v_start_date := v_end_date - interval '29 days';
      v_period_days := 30;
    WHEN '90d' THEN 
      v_start_date := v_end_date - interval '89 days';
      v_period_days := 90;
    WHEN '365d' THEN 
      v_start_date := v_end_date - interval '364 days';
      v_period_days := 365;
  END CASE;

  -- Compute common fields
  SELECT 
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE m.action = 'given')::integer,
    COUNT(*) FILTER (WHERE m.action = 'received')::integer,
    COUNT(*) FILTER (WHERE m.significance = true)::integer
  INTO v_total_moments, v_given_count, v_received_count, v_significant_count
  FROM public.moments m
  WHERE m.user_id = p_user
    AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date;

  -- Active days
  SELECT COUNT(DISTINCT (m.happened_at AT TIME ZONE p_tz)::date)::integer
  INTO v_active_days
  FROM public.moments m
  WHERE m.user_id = p_user
    AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date;

  v_quiet_days := v_period_days - v_active_days;

  -- Top categories (up to 3)
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', cat_data.name,
      'share', cat_data.share,
      'count', cat_data.count
    )
  )
  INTO v_top_categories
  FROM (
    SELECT 
      c.name,
      COUNT(*)::integer as count,
      ROUND((COUNT(*)::numeric / GREATEST(v_total_moments, 1)) * 100, 1) as share
    FROM public.moments m
    JOIN public.categories c ON c.id = m.category_id
    WHERE m.user_id = p_user
      AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 3
  ) cat_data;

  -- Top people (up to 3)
  SELECT jsonb_agg(
    jsonb_build_object(
      'display_name', people_data.display_name,
      'last_recorded_moment_at', people_data.last_recorded_moment_at
    )
  )
  INTO v_top_people
  FROM (
    SELECT 
      p.display_name,
      MAX(m.happened_at) as last_recorded_moment_at
    FROM public.moments m
    JOIN public.people p ON p.id = m.person_id
    WHERE m.user_id = p_user
      AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
    GROUP BY p.id, p.display_name
    ORDER BY COUNT(*) DESC
    LIMIT 3
  ) people_data;

  -- Median days between moments
  WITH gaps AS (
    SELECT 
      (m.happened_at AT TIME ZONE p_tz)::date - 
      LAG((m.happened_at AT TIME ZONE p_tz)::date) OVER (ORDER BY m.happened_at) AS gap_days
    FROM public.moments m
    WHERE m.user_id = p_user
      AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
  )
  SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY gap_days), 0)
  INTO v_median_days_between
  FROM gaps WHERE gap_days IS NOT NULL;

  -- Latest highlights (up to 3 significant moments)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', highlight_data.id,
      'happened_at', highlight_data.happened_at
    )
  )
  INTO v_latest_highlights
  FROM (
    SELECT m.id, m.happened_at
    FROM public.moments m
    WHERE m.user_id = p_user
      AND m.significance = true
      AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
    ORDER BY m.happened_at DESC
    LIMIT 3
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
    'top_categories', COALESCE(v_top_categories, '[]'::jsonb),
    'top_people', COALESCE(v_top_people, '[]'::jsonb),
    'median_days_between', v_median_days_between,
    'latest_highlights', COALESCE(v_latest_highlights, '[]'::jsonb)
  );

  -- Period-specific computations
  IF p_period = '7d' THEN
    -- 7d specific fields
    WITH current_streak AS (
      SELECT current, best FROM public.compute_streak(p_user)
    ),
    last_week_moments AS (
      SELECT COUNT(*)::integer as count
      FROM public.moments m
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN (v_start_date - interval '7 days')::date AND (v_end_date - interval '7 days')::date
    ),
    weekday_activity AS (
      SELECT 
        EXTRACT(dow FROM (m.happened_at AT TIME ZONE p_tz)) as dow,
        TO_CHAR((m.happened_at AT TIME ZONE p_tz), 'Day') as day_name,
        COUNT(*) as count
      FROM public.moments m
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
      GROUP BY dow, day_name
    ),
    most_active AS (
      SELECT TRIM(day_name) as day_name FROM weekday_activity ORDER BY count DESC LIMIT 1
    ),
    quietest_active AS (
      SELECT TRIM(day_name) as day_name FROM weekday_activity ORDER BY count ASC LIMIT 1
    )
    SELECT jsonb_build_object(
      'streak_delta', v_total_moments - lw.count,
      'most_active_day_of_week', COALESCE((SELECT day_name FROM most_active), 'None'),
      'quietest_day_of_week', COALESCE((SELECT day_name FROM quietest_active), 'None')
    )
    INTO v_period_specific
    FROM current_streak cs, last_week_moments lw;

  ELSIF p_period = '30d' THEN
    -- 30d specific fields
    WITH weekly_counts AS (
      SELECT 
        EXTRACT(week FROM (m.happened_at AT TIME ZONE p_tz)) as week_num,
        COUNT(*) as count
      FROM public.moments m
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
      GROUP BY week_num
      ORDER BY week_num DESC
      LIMIT 4
    ),
    new_people AS (
      SELECT COUNT(DISTINCT p.id)::integer as count
      FROM public.people p
      WHERE p.user_id = p_user
        AND p.created_at::date BETWEEN v_start_date AND v_end_date
    ),
    consistency AS (
      SELECT 
        CASE 
          WHEN v_active_days = 0 THEN 0
          ELSE ROUND(((v_active_days::numeric / v_period_days) * 100), 0)
        END as score
    )
    SELECT jsonb_build_object(
      'week_to_week_change_pct', COALESCE(array_agg(wc.count ORDER BY wc.week_num DESC), ARRAY[]::integer[]),
      'consistency_score', c.score,
      'new_people_count', np.count
    )
    INTO v_period_specific
    FROM weekly_counts wc, new_people np, consistency c
    GROUP BY c.score, np.count;

  ELSIF p_period = '90d' THEN
    -- 90d specific fields  
    WITH top_tags AS (
      SELECT tag, COUNT(*) as count
      FROM public.moments m, unnest(m.tags) AS tag
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 3
    )
    SELECT jsonb_build_object(
      'shifting_categories', '[]'::jsonb,
      'longest_gap_closed', null,
      'tags_top', COALESCE(array_agg(tt.tag), ARRAY[]::text[])
    )
    INTO v_period_specific
    FROM top_tags tt;

  ELSIF p_period = '365d' THEN
    -- 365d specific fields
    WITH first_moment AS (
      SELECT MIN(m.happened_at)::date as date
      FROM public.moments m
      WHERE m.user_id = p_user
    ),
    best_streak AS (
      SELECT best FROM public.compute_streak(p_user)
    ),
    monthly_counts AS (
      SELECT 
        TO_CHAR((m.happened_at AT TIME ZONE p_tz), 'Month') as month_name,
        COUNT(*) as count
      FROM public.moments m
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
      GROUP BY month_name
    ),
    kindest_month AS (
      SELECT TRIM(month_name) as month_name FROM monthly_counts ORDER BY count DESC LIMIT 1
    ),
    peak_month AS (
      SELECT TRIM(month_name) as month_name FROM monthly_counts ORDER BY count DESC LIMIT 1  
    ),
    top_connections AS (
      SELECT p.display_name, COUNT(*) as shared_count
      FROM public.moments m
      JOIN public.people p ON p.id = m.person_id
      WHERE m.user_id = p_user
        AND (m.happened_at AT TIME ZONE p_tz)::date BETWEEN v_start_date AND v_end_date
      GROUP BY p.id, p.display_name
      ORDER BY shared_count DESC
      LIMIT 5
    )
    SELECT jsonb_build_object(
      'milestones', jsonb_build_object(
        'first_moment_date', fm.date,
        'best_streak', bs.best,
        'kindest_month', COALESCE((SELECT month_name FROM kindest_month), 'None')
      ),
      'seasonality', COALESCE((SELECT month_name FROM peak_month), 'None'),
      'top_connections', COALESCE(array_agg(jsonb_build_object('display_name', tc.display_name, 'shared_count', tc.shared_count)), ARRAY[]::jsonb[])
    )
    INTO v_period_specific
    FROM first_moment fm, best_streak bs
    LEFT JOIN top_connections tc ON true
    GROUP BY fm.date, bs.best;
  END IF;

  -- Merge period-specific fields into computed
  v_computed := v_computed || v_period_specific;

  -- Generate summary and suggestions (rule-based fallback for now)
  CASE p_period
    WHEN '7d' THEN 
      v_summary := format('This week you recorded %s moments of kindness. You were active on %s days, with %s moments given and %s received.',
        v_total_moments, v_active_days, v_given_count, v_received_count);
      v_suggestions := 'Consider reaching out to someone you haven''t connected with recently, or try a small act of kindness tomorrow.';
    WHEN '30d' THEN
      v_summary := format('Over the past month, you captured %s moments across %s active days. Your kindness balance shows %s given and %s received.',
        v_total_moments, v_active_days, v_given_count, v_received_count);
      v_suggestions := 'Reflect on patterns you notice and consider expanding kindness into new areas of your life.';
    WHEN '90d' THEN
      v_summary := format('In the past quarter, you documented %s moments of kindness over %s days. This includes %s significant moments worth remembering.',
        v_total_moments, v_active_days, v_significant_count);
      v_suggestions := 'Look for opportunities to deepen existing connections and explore new ways to show kindness.';
    WHEN '365d' THEN
      v_summary := format('Over the past year, you''ve captured %s moments of kindness across %s active days - a beautiful record of your caring nature.',
        v_total_moments, v_active_days);
      v_suggestions := 'Take time to appreciate how far you''ve come and set gentle intentions for continued growth in kindness.';
  END CASE;

  -- Upsert reflection
  INSERT INTO public.reflections (
    user_id, period, range_start, range_end, summary, suggestions, computed, model, regenerated_at
  )
  VALUES (
    p_user, p_period, v_start_date, v_end_date, v_summary, v_suggestions, v_computed, v_model, now()
  )
  ON CONFLICT (user_id, period, range_start, range_end)
  DO UPDATE SET
    summary = EXCLUDED.summary,
    suggestions = EXCLUDED.suggestions,
    computed = EXCLUDED.computed,
    model = EXCLUDED.model,
    regenerated_at = EXCLUDED.regenerated_at
  RETURNING id INTO v_reflection_id;

  -- Return the full row
  RETURN QUERY
  SELECT r.id, r.user_id, r.period, r.range_start, r.range_end, 
         r.summary, r.suggestions, r.computed, r.model, r.created_at, r.regenerated_at
  FROM public.reflections r
  WHERE r.id = v_reflection_id;
END;
$$;