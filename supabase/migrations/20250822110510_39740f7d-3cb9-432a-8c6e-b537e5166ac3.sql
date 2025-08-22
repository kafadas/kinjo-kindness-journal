-- Fix security warnings: Set search_path for all functions

-- Fix auth_uid function
create or replace function auth_uid() returns uuid
language sql stable
security definer set search_path = public
as $$ select auth.uid() $$;

-- Fix insight helper functions with proper search_path
create or replace function public.given_received_by_category(_user uuid, _from timestamptz, _to timestamptz)
returns table(category_id uuid, category_name text, given_count int, received_count int)
language sql stable
security definer set search_path = public
as $$
  select
    c.id, c.name,
    count(*) filter (where m.action = 'given')::int as given_count,
    count(*) filter (where m.action = 'received')::int as received_count
  from moments m
  join categories c on c.id = m.category_id
  where m.user_id = _user
    and m.happened_at >= _from and m.happened_at < _to
  group by c.id, c.name
  order by c.name;
$$;

create or replace function public.opportunities_people(_user uuid, _from timestamptz, _to timestamptz, _limit int default 5)
returns table(person_id uuid, display_name text, last_recorded timestamptz, days_since int)
language sql stable
security definer set search_path = public
as $$
  with last_m as (
    select person_id, max(happened_at) as last_time
    from moments where user_id = _user group by person_id
  )
  select p.id, p.display_name, l.last_time,
         extract(day from (now() - coalesce(l.last_time, _from)))::int as days_since
  from people p
  left join last_m l on l.person_id = p.id
  where p.user_id = _user
  order by coalesce(l.last_time, timestamp '1900-01-01') asc
  limit _limit;
$$;

create or replace function public.significant_moments(_user uuid, _from timestamptz, _to timestamptz)
returns table(moment_id uuid, happened_at timestamptz, description text, person_id uuid, category_id uuid)
language sql stable
security definer set search_path = public
as $$
  select m.id, m.happened_at, m.description, m.person_id, m.category_id
  from moments m
  where m.user_id = _user and m.significance = true
    and m.happened_at >= _from and m.happened_at < _to
  order by m.happened_at desc
  limit 20;
$$;

create or replace function public.compute_streak(_user uuid)
returns table(current int, best int, last_entry_date date)
language plpgsql stable
security definer set search_path = public
as $$
declare cur int := 0; best int := 0; last_d date := null; rec record;
begin
  for rec in
    select distinct happened_at::date as d
    from moments where user_id = _user order by d desc
  loop
    if last_d is null then cur := 1;
    else
      if last_d - rec.d = 1 then cur := cur + 1; else best := greatest(best, cur); cur := 1; end if;
    end if;
    last_d := rec.d;
  end loop;
  best := greatest(best, cur);
  return query select cur, best, last_d;
end$$;