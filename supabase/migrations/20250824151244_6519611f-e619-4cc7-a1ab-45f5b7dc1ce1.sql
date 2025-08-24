-- Fix category_share_delta function to handle null start/end dates properly
-- This addresses the issue where "All" timeline filter shows 0 values

CREATE OR REPLACE FUNCTION public.category_share_delta(p_user uuid, p_start date, p_end date, p_action text DEFAULT 'both'::text, p_significant_only boolean DEFAULT false, p_tz text DEFAULT 'UTC'::text)
 RETURNS TABLE(category_id uuid, category_name text, cnt integer, pct numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
with filtered as (
  select m.category_id
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
),
totals as (
  select count(*) as total from filtered
)
select
  c.id,
  c.name,
  coalesce(count(f.category_id),0)::int as cnt,
  case when (select total from totals) > 0
       then round(100.0 * coalesce(count(f.category_id),0) / (select total from totals), 1)
       else 0 end as pct
from public.categories c
left join filtered f on f.category_id = c.id
where c.user_id = p_user
group by c.id, c.name, (select total from totals)
order by cnt desc, c.name;
$function$