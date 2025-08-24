-- Daily counts in the user's timezone, honoring action + significant filters
CREATE OR REPLACE FUNCTION public.daily_moment_counts(
  p_user uuid,
  p_start date DEFAULT NULL,
  p_end   date DEFAULT NULL,
  p_action text DEFAULT 'both',            -- 'both'|'given'|'received'
  p_significant_only boolean DEFAULT false,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE(d date, total int, given int, received int)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
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
    COALESCE(SUM((b.action IS NOT NULL)::int),0)                                           AS total,
    COALESCE(SUM((b.action = 'given')::int),0)                                             AS given,
    COALESCE(SUM((b.action = 'received')::int),0)                                          AS received
  FROM days d
  LEFT JOIN base b ON b.d = d.d
  GROUP BY d.d
  ORDER BY d.d;
$$;

-- Category share + delta, honoring action + significant + timezone dates
CREATE OR REPLACE FUNCTION public.category_share_delta(
  p_user uuid,
  p_start date,
  p_end   date,
  p_action text DEFAULT 'both',
  p_significant_only boolean DEFAULT false,
  p_tz text DEFAULT 'UTC'
)
RETURNS TABLE(category_id uuid, name text, cnt int, pct numeric, delta_pct numeric)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
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
         COALESCE(w.c,0)                         AS cnt,
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

-- Optional helper for "All" range: min/max dates in user's timezone
CREATE OR REPLACE FUNCTION public.user_moment_bounds(p_user uuid, p_tz text DEFAULT 'UTC')
RETURNS TABLE(min_date date, max_date date)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    MIN(timezone(p_tz, happened_at))::date,
    MAX(timezone(p_tz, happened_at))::date
  FROM moments
  WHERE user_id = p_user;
$$;