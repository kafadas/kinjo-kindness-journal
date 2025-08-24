-- Update category_share_delta function to be timezone-aware
CREATE OR REPLACE FUNCTION public.category_share_delta(
  p_user uuid, 
  p_start date, 
  p_end date, 
  p_action text DEFAULT 'both',
  p_significant_only boolean DEFAULT false
)
RETURNS TABLE(category_id uuid, name text, cnt integer, pct numeric, delta_pct numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH user_tz AS (
    SELECT COALESCE(p.timezone, 'UTC') AS tz
    FROM profiles p 
    WHERE p.user_id = p_user
  ),
  win AS (
    SELECT category_id, count(*) c
    FROM moments m, user_tz tz
    WHERE m.user_id = p_user
      AND (p_start IS NULL OR (m.happened_at AT TIME ZONE tz.tz)::date >= p_start)
      AND (p_end IS NULL OR (m.happened_at AT TIME ZONE tz.tz)::date <= p_end)
      AND (p_action='both' OR m.action::text=p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
    GROUP BY 1
  ),
  base AS (
    SELECT category_id, count(*) c
    FROM moments m, user_tz tz
    WHERE m.user_id = p_user
      AND p_start IS NOT NULL 
      AND p_end IS NOT NULL
      AND (m.happened_at AT TIME ZONE tz.tz)::date BETWEEN (p_start - (p_end - p_start)) AND (p_start - 1)
      AND (p_action='both' OR m.action::text=p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
    GROUP BY 1
  ),
  totals AS (
    SELECT (SELECT COALESCE(sum(c),0) FROM win) wtot,
           (SELECT COALESCE(sum(c),0) FROM base) btot
  )
  SELECT c.id, c.name,
         COALESCE(w.c,0) AS cnt,
         CASE WHEN t.wtot=0 THEN 0 ELSE COALESCE(w.c,0)::numeric / t.wtot END AS pct,
         CASE WHEN t.btot=0 THEN 0
              ELSE (COALESCE(w.c,0)::numeric / GREATEST(t.wtot, 1)) - (COALESCE(b.c,0)::numeric / GREATEST(t.btot, 1))
         END AS delta_pct
  FROM categories c
  JOIN totals t ON true
  LEFT JOIN win w ON w.category_id = c.id
  LEFT JOIN base b ON b.category_id = c.id
  WHERE c.user_id = p_user
  ORDER BY pct DESC NULLS LAST;
$$;