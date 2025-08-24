-- Update RPC functions to handle null date parameters for "all" range

-- Update daily_moment_counts to handle null dates
CREATE OR REPLACE FUNCTION public.daily_moment_counts(p_user uuid, p_start date, p_end date, p_action text DEFAULT 'both'::text, p_significant_only boolean DEFAULT false)
 RETURNS TABLE(d date, total integer, given integer, received integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH date_bounds AS (
    SELECT 
      COALESCE(p_start, (SELECT MIN(happened_at::date) FROM moments WHERE user_id = p_user)) as start_date,
      COALESCE(p_end, (SELECT MAX(happened_at::date) FROM moments WHERE user_id = p_user)) as end_date
  ),
  days AS (
    SELECT generate_series(
      (SELECT start_date FROM date_bounds), 
      (SELECT end_date FROM date_bounds), 
      '1 day'
    )::date d
  )
  SELECT d,
         COALESCE(SUM((m.happened_at::date=d AND (p_action='both' OR m.action::text = p_action) AND (NOT p_significant_only OR m.significance IS TRUE))::int),0) AS total,
         COALESCE(SUM(((m.happened_at::date=d) AND m.action='given' AND (p_action='both' OR m.action::text = p_action) AND (NOT p_significant_only OR m.significance IS TRUE))::int),0) AS given,
         COALESCE(SUM(((m.happened_at::date=d) AND m.action='received' AND (p_action='both' OR m.action::text = p_action) AND (NOT p_significant_only OR m.significance IS TRUE))::int),0) AS received
  FROM days
  LEFT JOIN moments m ON m.user_id = p_user
                     AND (p_start IS NULL OR m.happened_at::date >= p_start)
                     AND (p_end IS NULL OR m.happened_at::date <= p_end)
  GROUP BY d
  ORDER BY d;
$function$;

-- Update category_share_delta to handle null dates
CREATE OR REPLACE FUNCTION public.category_share_delta(p_user uuid, p_start date, p_end date, p_action text DEFAULT 'both'::text, p_significant_only boolean DEFAULT false)
 RETURNS TABLE(category_id uuid, name text, pct numeric, delta_pct numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH win AS (
    SELECT category_id, count(*) c
    FROM moments WHERE user_id = p_user
      AND (p_start IS NULL OR happened_at::date >= p_start)
      AND (p_end IS NULL OR happened_at::date <= p_end)
      AND (p_action='both' OR action::text = p_action)
      AND (NOT p_significant_only OR significance IS TRUE)
    GROUP BY 1
  ),
  base AS (
    SELECT category_id, count(*) c
    FROM moments WHERE user_id = p_user
      AND (p_start IS NULL OR happened_at::date >= (p_start - (COALESCE(p_end, CURRENT_DATE) - COALESCE(p_start, '1900-01-01'::date))))
      AND (p_start IS NULL OR happened_at::date <= (p_start - 1))
      AND (p_action='both' OR action::text = p_action)
      AND (NOT p_significant_only OR significance IS TRUE)
    GROUP BY 1
  ),
  totals AS (
    SELECT (SELECT COALESCE(sum(c),0) FROM win) wtot,
           (SELECT COALESCE(sum(c),0) FROM base) btot
  )
  SELECT c.id, c.name,
         CASE WHEN t.wtot=0 THEN 0 ELSE COALESCE(w.c,0)::numeric / t.wtot END AS pct,
         CASE WHEN t.btot=0 THEN 0
              ELSE (COALESCE(w.c,0)::numeric / t.wtot) - (COALESCE(b.c,0)::numeric / t.btot)
         END AS delta_pct
  FROM categories c
  JOIN totals t ON true
  LEFT JOIN win w ON w.category_id = c.id
  LEFT JOIN base b ON b.category_id = c.id
  WHERE c.user_id = p_user
  ORDER BY pct DESC NULLS LAST;
$function$;

-- Update median_gap_by_category to handle null dates
CREATE OR REPLACE FUNCTION public.median_gap_by_category(p_user uuid, p_start date, p_end date, p_action text DEFAULT 'both'::text, p_significant_only boolean DEFAULT false)
 RETURNS TABLE(category_id uuid, name text, median_days numeric)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH seq AS (
    SELECT m.category_id,
           m.happened_at::date d,
           lag(m.happened_at::date) OVER (PARTITION BY m.category_id ORDER BY m.happened_at) prev_d
    FROM moments m
    WHERE m.user_id = p_user 
      AND (p_start IS NULL OR m.happened_at::date >= p_start)
      AND (p_end IS NULL OR m.happened_at::date <= p_end)
      AND (p_action='both' OR m.action::text = p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
  ), gaps AS (
    SELECT category_id, (d - prev_d) AS gap
    FROM seq WHERE prev_d IS NOT NULL
  )
  SELECT c.id, c.name,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY gap) AS median_days
  FROM categories c
  LEFT JOIN gaps g ON g.category_id=c.id
  WHERE c.user_id = p_user
  GROUP BY c.id, c.name;
$function$;

-- Add helper function to get user's moment date range for chart domains
CREATE OR REPLACE FUNCTION public.get_user_moment_date_range(p_user uuid)
 RETURNS TABLE(min_date date, max_date date)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    MIN(happened_at::date) as min_date,
    MAX(happened_at::date) as max_date
  FROM moments 
  WHERE user_id = p_user;
$function$;