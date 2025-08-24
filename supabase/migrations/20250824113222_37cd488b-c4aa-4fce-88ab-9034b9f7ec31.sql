-- Clean up all existing versions of conflicting functions
DROP FUNCTION IF EXISTS public.daily_moment_counts(uuid, date, date);
DROP FUNCTION IF EXISTS public.daily_moment_counts(uuid, date, date, text, boolean);
DROP FUNCTION IF EXISTS public.daily_moment_counts(uuid, date, date, text, boolean, text);
DROP FUNCTION IF EXISTS public.category_share_delta(uuid, date, date);
DROP FUNCTION IF EXISTS public.category_share_delta(uuid, date, date, text, boolean);
DROP FUNCTION IF EXISTS public.category_share_delta(uuid, date, date, text, boolean, text);
DROP FUNCTION IF EXISTS public.median_gap_by_category(uuid, date, date);
DROP FUNCTION IF EXISTS public.median_gap_by_category(uuid, date, date, text, boolean);

-- Create the canonical timezone-aware functions
CREATE OR REPLACE FUNCTION public.daily_moment_counts(
  p_user uuid,
  p_start date DEFAULT NULL,
  p_end date DEFAULT NULL,
  p_action text DEFAULT 'both',
  p_significant_only boolean DEFAULT false,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE(d date, total integer, given integer, received integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH days AS (
    SELECT generate_series(
      COALESCE(p_start, (SELECT MIN(timezone(p_tz, happened_at))::date FROM moments WHERE user_id=p_user)),
      COALESCE(p_end,   (SELECT MAX(timezone(p_tz, happened_at))::date FROM moments WHERE user_id=p_user)),
      '1 day'::interval
    )::date d
  ),
  base AS (
    SELECT
      timezone(p_tz, m.happened_at)::date AS d,
      m.action,
      m.significance
    FROM moments m
    WHERE m.user_id = p_user
      AND (p_start IS NULL OR timezone(p_tz, m.happened_at)::date >= p_start)
      AND (p_end   IS NULL OR timezone(p_tz, m.happened_at)::date <= p_end)
      AND (p_action = 'both' OR m.action::text = p_action)
      AND (NOT p_significant_only OR m.significance IS TRUE)
  )
  SELECT
    d.d,
    COALESCE(SUM((b.action IS NOT NULL)::int),0) AS total,
    COALESCE(SUM((b.action = 'given')::int),0) AS given,
    COALESCE(SUM((b.action = 'received')::int),0) AS received
  FROM days d
  LEFT JOIN base b ON b.d = d.d
  GROUP BY d.d
  ORDER BY d.d;
$$;

CREATE OR REPLACE FUNCTION public.category_share_delta(
  p_user uuid,
  p_start date,
  p_end date,
  p_action text DEFAULT 'both',
  p_significant_only boolean DEFAULT false,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE(category_id uuid, name text, cnt integer, pct numeric, delta_pct numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH win AS (
    SELECT category_id, count(*) c
    FROM moments
    WHERE user_id = p_user
      AND timezone(p_tz, happened_at)::date BETWEEN p_start AND p_end
      AND (p_action='both' OR action::text=p_action)
      AND (NOT p_significant_only OR significance IS TRUE)
    GROUP BY 1
  ),
  base AS (
    SELECT category_id, count(*) c
    FROM moments
    WHERE user_id = p_user
      AND timezone(p_tz, happened_at)::date BETWEEN (p_start - (p_end - p_start)) AND (p_start - 1)
      AND (p_action='both' OR action::text=p_action)
      AND (NOT p_significant_only OR significance IS TRUE)
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
              ELSE (COALESCE(w.c,0)::numeric / t.wtot) - (COALESCE(b.c,0)::numeric / t.btot)
         END AS delta_pct
  FROM categories c
  JOIN totals t ON true
  LEFT JOIN win w ON w.category_id = c.id
  LEFT JOIN base b ON b.category_id = c.id
  WHERE c.user_id = p_user
  ORDER BY pct DESC NULLS LAST;
$$;

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
$$;