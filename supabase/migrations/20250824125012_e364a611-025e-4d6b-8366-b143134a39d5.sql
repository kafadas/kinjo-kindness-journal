-- Update median_gap_by_category function to be timezone-aware
CREATE OR REPLACE FUNCTION public.median_gap_by_category(
  p_user uuid, 
  p_start date, 
  p_end date, 
  p_action text DEFAULT 'both',
  p_significant_only boolean DEFAULT false
)
RETURNS TABLE(category_id uuid, name text, median_days numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_tz AS (
    SELECT COALESCE(p.timezone, 'UTC') AS tz
    FROM profiles p 
    WHERE p.user_id = p_user
  ),
  seq AS (
    SELECT m.category_id,
           (m.happened_at AT TIME ZONE tz.tz)::date d,
           lag((m.happened_at AT TIME ZONE tz.tz)::date) OVER (PARTITION BY m.category_id ORDER BY m.happened_at) prev_d
    FROM moments m, user_tz tz
    WHERE m.user_id = p_user 
      AND (p_start IS NULL OR (m.happened_at AT TIME ZONE tz.tz)::date >= p_start)
      AND (p_end IS NULL OR (m.happened_at AT TIME ZONE tz.tz)::date <= p_end)
      AND (p_action='both' OR m.action::text = p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
  ), 
  gaps AS (
    SELECT category_id, (d - prev_d) AS gap
    FROM seq WHERE prev_d IS NOT NULL
  )
  SELECT c.id, c.name,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gap) AS median_days
  FROM categories c
  LEFT JOIN gaps g ON g.category_id=c.id
  WHERE c.user_id = p_user
  GROUP BY c.id, c.name;
$$;