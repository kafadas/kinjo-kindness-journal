-- Create function to find best streak window within a date range
create or replace function public.best_streak_window(
  p_user uuid,
  p_start date,
  p_end date
) returns table(streak int, d_start date, d_end date) 
language sql 
security definer 
set search_path = public
as $$
with days as (
  select d::date as day
  from generate_series(p_start, p_end, interval '1 day') g(d)
),
has_moment as (
  select day, (exists (
    select 1 from moments m
    where m.user_id = p_user and m.happened_at::date = day
  )) as has
  from days
),
runs as (
  select day,
         has,
         case when has and not lag(has,1,false) over (order by day) then 1 else 0 end as start_flag
  from has_moment
),
grouped as (
  select day, has,
         sum(start_flag) over (order by day) as grp
  from runs
),
summ as (
  select grp,
         min(day) filter (where has) as s,
         max(day) filter (where has) as e,
         count(*) filter (where has) as len
  from grouped
  group by grp
)
select coalesce(max(len),0) as streak,
       (select s from summ order by len desc, s asc limit 1) as d_start,
       (select e from summ order by len desc, s asc limit 1) as d_end;
$$;