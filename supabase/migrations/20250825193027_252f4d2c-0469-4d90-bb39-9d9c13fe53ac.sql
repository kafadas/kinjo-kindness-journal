-- Create SQL helper functions for consistent date handling

-- Helper to get local date from timestamptz in user timezone
CREATE OR REPLACE FUNCTION public.moment_date_local(ts timestamptz, tz text)
RETURNS date
LANGUAGE sql 
IMMUTABLE
AS $$
  SELECT (ts AT TIME ZONE tz)::date;
$$;

-- Helper to query moments within date range using local timezone
CREATE OR REPLACE FUNCTION public.moments_in_range(
  p_user uuid, 
  p_start date, 
  p_end date, 
  p_tz text
)
RETURNS SETOF public.moments
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.*
  FROM public.moments m
  WHERE m.user_id = p_user
    AND public.moment_date_local(m.happened_at, p_tz) BETWEEN p_start AND p_end;
$$;

-- Helper to get user timezone with fallback chain
CREATE OR REPLACE FUNCTION public.get_user_timezone(p_user uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT timezone FROM public.profiles WHERE user_id = p_user),
    (SELECT 'UTC' FROM public.settings WHERE user_id = p_user),
    'UTC'
  );
$$;