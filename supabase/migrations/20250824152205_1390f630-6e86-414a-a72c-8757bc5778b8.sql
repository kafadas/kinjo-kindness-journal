-- Add monthly overview function for Trends page
CREATE OR REPLACE FUNCTION public.monthly_overview(
  p_user uuid,
  p_action text DEFAULT 'both'::text, 
  p_significant_only boolean DEFAULT false, 
  p_tz text DEFAULT 'UTC'::text
)
RETURNS TABLE(current_month_count integer, previous_month_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
with current_month as (
  select 
    date_trunc('month', current_timestamp at time zone p_tz)::date as start_date,
    (date_trunc('month', current_timestamp at time zone p_tz) + interval '1 month - 1 day')::date as end_date
),
previous_month as (
  select 
    (date_trunc('month', current_timestamp at time zone p_tz) - interval '1 month')::date as start_date,
    (date_trunc('month', current_timestamp at time zone p_tz) - interval '1 day')::date as end_date
),
current_count as (
  select count(*)::integer as cnt
  from public.moments m, current_month cm
  where m.user_id = p_user
    and (m.happened_at at time zone p_tz)::date between cm.start_date and cm.end_date
    and (case when p_action = 'both' then true else m.action = p_action::public.action_t end)
    and (not p_significant_only or m.significance is true)
),
previous_count as (
  select count(*)::integer as cnt
  from public.moments m, previous_month pm
  where m.user_id = p_user
    and (m.happened_at at time zone p_tz)::date between pm.start_date and pm.end_date
    and (case when p_action = 'both' then true else m.action = p_action::public.action_t end)
    and (not p_significant_only or m.significance is true)
)
select 
  cc.cnt as current_month_count,
  pc.cnt as previous_month_count
from current_count cc, previous_count pc;
$function$