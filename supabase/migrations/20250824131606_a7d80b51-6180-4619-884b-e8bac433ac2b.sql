-- 1) Remove old overloads that cause ambiguity
drop function if exists public.daily_moment_counts(uuid, date, date, text, boolean);
drop function if exists public.category_share_delta(uuid, date, date, text, boolean);

-- 2) (No CREATE here — keep the existing 6‑arg versions that include p_tz)
--    They should already exist as:
--    daily_moment_counts(p_user uuid, p_start date, p_end date, p_action text, p_significant_only boolean, p_tz text)
--    category_share_delta(p_user uuid, p_start date, p_end date, p_action text, p_significant_only boolean, p_tz text)

-- 3) Verify: only a single row per function name should remain, each with 6 args
select
  proname,
  oidvectortypes(proargtypes) as argtypes
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('daily_moment_counts','category_share_delta')
order by proname, argtypes;