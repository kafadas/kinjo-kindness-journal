-- Update daily_moment_counts function to be timezone-aware and handle "all" range properly
CREATE OR REPLACE FUNCTION public.daily_moment_counts(
  p_user uuid, 
  p_start date DEFAULT NULL, 
  p_end date DEFAULT NULL, 
  p_action text DEFAULT 'both', 
  p_significant_only boolean DEFAULT false
) 
RETURNS TABLE(d date, total integer, given integer, received integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_tz AS (
    SELECT COALESCE(p.timezone, 'UTC') AS tz
    FROM profiles p 
    WHERE p.user_id = p_user
  ),
  bounds AS (
    SELECT
      CASE 
        WHEN p_start IS NULL THEN (
          SELECT MIN((m.happened_at AT TIME ZONE tz.tz))::date 
          FROM moments m, user_tz tz 
          WHERE m.user_id = p_user
        )
        ELSE p_start 
      END AS start_date,
      CASE 
        WHEN p_end IS NULL THEN (
          SELECT MAX((m.happened_at AT TIME ZONE tz.tz))::date
          FROM moments m, user_tz tz 
          WHERE m.user_id = p_user
        )
        ELSE p_end 
      END AS end_date,
      tz.tz
    FROM user_tz tz
  ),
  days AS (
    SELECT generate_series(
      COALESCE(b.start_date, CURRENT_DATE),
      COALESCE(b.end_date, CURRENT_DATE),
      '1 day'::interval
    )::date AS d
    FROM bounds b
  ),
  base AS (
    SELECT
      (m.happened_at AT TIME ZONE b.tz)::date AS d,
      m.action,
      m.significance
    FROM moments m, bounds b
    WHERE m.user_id = p_user
      AND (p_start IS NULL OR (m.happened_at AT TIME ZONE b.tz)::date >= p_start)
      AND (p_end IS NULL OR (m.happened_at AT TIME ZONE b.tz)::date <= p_end)
      AND (p_action = 'both' OR m.action::text = p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
  )
  SELECT
    d.d,
    COALESCE(SUM((b.action IS NOT NULL)::int), 0) AS total,
    COALESCE(SUM((b.action = 'given')::int), 0) AS given,
    COALESCE(SUM((b.action = 'received')::int), 0) AS received
  FROM days d
  LEFT JOIN base b ON b.d = d.d
  GROUP BY d.d
  ORDER BY d.d;
$$;