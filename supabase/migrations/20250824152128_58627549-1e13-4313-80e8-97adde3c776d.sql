-- Add weekly patterns function for Trends page
CREATE OR REPLACE FUNCTION public.weekly_patterns(
  p_user uuid, 
  p_start date, 
  p_end date, 
  p_action text DEFAULT 'both'::text, 
  p_significant_only boolean DEFAULT false, 
  p_tz text DEFAULT 'UTC'::text
)
RETURNS TABLE(weekday integer, weekday_name text, count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
with filtered as (
  select 
    extract(dow from (m.happened_at at time zone p_tz))::integer as dow,
    count(*) as cnt
  from public.moments m
  where m.user_id = p_user
    and (
      -- Handle null dates properly - if both are null, include all moments
      (p_start IS NULL AND p_end IS NULL) OR
      (p_start IS NULL AND (m.happened_at at time zone p_tz)::date <= p_end) OR
      (p_end IS NULL AND (m.happened_at at time zone p_tz)::date >= p_start) OR
      ((m.happened_at at time zone p_tz)::date between p_start and p_end)
    )
    and (case when p_action = 'both' then true else m.action = p_action::public.action_t end)
    and (not p_significant_only or m.significance is true)
  group by extract(dow from (m.happened_at at time zone p_tz))
),
weekdays as (
  select 
    w.dow,
    case w.dow
      when 0 then 'Sunday'
      when 1 then 'Monday' 
      when 2 then 'Tuesday'
      when 3 then 'Wednesday'
      when 4 then 'Thursday'
      when 5 then 'Friday'
      when 6 then 'Saturday'
    end as name
  from (values (0),(1),(2),(3),(4),(5),(6)) as w(dow)
)
select 
  wd.dow,
  wd.name,
  coalesce(f.cnt, 0)::integer
from weekdays wd
left join filtered f on f.dow = wd.dow
order by wd.dow;
$function$