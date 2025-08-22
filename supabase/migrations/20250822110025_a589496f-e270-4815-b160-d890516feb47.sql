-- =========================
-- Phase 2: Kinjo schema
-- =========================

-- 0) ENUMS
create type action_t as enum ('given','received');

-- 1) PROFILES
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

-- 2) CATEGORIES (user-scoped; defaults seeded on first login)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  is_default boolean default false,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_categories_user on categories(user_id);
create unique index if not exists uq_categories_slug_per_user on categories(user_id, slug);

-- 3) GROUPS
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text,
  sort_order int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_groups_user on groups(user_id);

-- 4) PEOPLE
create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  aliases text[] default '{}',
  avatar_type text check (avatar_type in ('initials','emoji','photo')) default 'initials',
  avatar_value text,
  merged_into uuid references people(id),
  last_recorded_moment_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_people_user on people(user_id);
create index if not exists idx_people_merged on people(merged_into);

-- 5) PEOPLE ↔ GROUPS
create table if not exists person_groups (
  person_id uuid references people(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (person_id, group_id)
);

-- 6) MOMENTS (entries)
create table if not exists moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid references people(id),
  category_id uuid references categories(id),
  action action_t not null,
  happened_at timestamptz not null,
  description text,
  tags text[] default '{}',
  significance boolean default false,
  source text check (source in ('text','voice')) default 'text',
  attachment_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_moments_user_time on moments(user_id, happened_at desc);
create index if not exists idx_moments_person on moments(person_id);
create index if not exists idx_moments_category on moments(category_id);

-- 7) ATTACHMENTS (metadata; files in Storage bucket `attachments`)
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moment_id uuid not null references moments(id) on delete cascade,
  path text not null,  -- "userId/momentId/filename"
  mime text,
  created_at timestamptz default now()
);
create index if not exists idx_attachments_user on attachments(user_id);
create index if not exists idx_attachments_moment on attachments(moment_id);

-- 8) STREAKS (optional cache)
create table if not exists streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current int default 0,
  best int default 0,
  last_entry_date date,
  updated_at timestamptz default now()
);

-- 9) SETTINGS
create table if not exists settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discreet_mode boolean default false,
  default_capture_mode text check (default_capture_mode in ('text','voice')) default 'text',
  default_category_id uuid references categories(id),
  email_opt_in boolean default true,
  weekly_digest boolean default true,
  ai_provider text default 'openai',
  theme text default 'indigo'
);

-- 10) PROMPTS (global or per-user)
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),  -- null = global
  text text not null,
  theme text,
  weight int default 1,
  is_active boolean default true
);
create index if not exists idx_prompts_user on prompts(user_id);

-- 11) REFLECTIONS (cached AI summaries)
create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  range_start date,
  range_end date,
  summary text,
  suggestions text,
  created_at timestamptz default now()
);
create index if not exists idx_reflections_user on reflections(user_id);

-- 12) NUDGES
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nudge_type text,   -- 'person_gap','category_gap','streak'
  entity_id uuid,    -- person_id or category_id
  last_shown_at timestamptz,
  snoozed_until timestamptz
);
create index if not exists idx_nudges_user on nudges(user_id);

-- =========================
-- Enable RLS & policies
-- =========================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table groups enable row level security;
alter table people enable row level security;
alter table person_groups enable row level security;
alter table moments enable row level security;
alter table attachments enable row level security;
alter table streaks enable row level security;
alter table settings enable row level security;
alter table prompts enable row level security;
alter table reflections enable row level security;
alter table nudges enable row level security;

create or replace function auth_uid() returns uuid
language sql stable as $$ select auth.uid() $$;

-- Profiles policies (explicit, then loop for the rest)
create policy if not exists "ro_user_rows_profiles"
  on profiles for select using (user_id = auth.uid());
create policy if not exists "rw_user_rows_profiles"
  on profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Boilerplate per-table user ownership policies
do $$
declare t text;
begin
  for t in
    select unnest( array[
      'categories','groups','people','person_groups','moments',
      'attachments','streaks','settings','reflections','nudges'
    ] )
  loop
    execute format('create policy if not exists "ro_user_rows_%1$s" on %1$s for select using (user_id = auth.uid());', t);
    execute format('create policy if not exists "rw_user_rows_%1$s" on %1$s for all using (user_id = auth.uid()) with check (user_id = auth.uid());', t);
  end loop;
end$$;

-- Prompts: read global or own; write only own
create policy if not exists "prompts_read_global_or_own"
on prompts for select using (user_id is null or user_id = auth.uid());
create policy if not exists "prompts_rw_own"
on prompts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =========================
-- Storage policies (bucket: attachments)
-- =========================
-- Create bucket 'attachments' in Storage UI first.
-- Path format: userId/momentId/filename
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict do nothing;

create policy if not exists "storage_read_own_attachments"
on storage.objects for select
using (bucket_id = 'attachments' and ( (storage.foldername(name))[1]::uuid = auth.uid() ));

create policy if not exists "storage_write_own_attachments"
on storage.objects for insert
with check (bucket_id = 'attachments' and ( (storage.foldername(name))[1]::uuid = auth.uid() ));

create policy if not exists "storage_delete_own_attachments"
on storage.objects for delete
using (bucket_id = 'attachments' and ( (storage.foldername(name))[1]::uuid = auth.uid() ));

-- =========================
-- Seed defaults on new user
-- =========================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, coalesce(new.email, '')) on conflict do nothing;

  insert into public.categories(user_id, name, slug, is_default, sort_order) values
    (new.id, 'Family', 'family', true, 1),
    (new.id, 'Friends', 'friends', true, 2),
    (new.id, 'Work', 'work', true, 3),
    (new.id, 'Community', 'community', true, 4),
    (new.id, 'Other', 'other', true, 5);

  insert into public.settings(user_id) values (new.id) on conflict do nothing;
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- Insight helpers (read-only functions)
-- =========================

create or replace function public.given_received_by_category(_user uuid, _from timestamptz, _to timestamptz)
returns table(category_id uuid, category_name text, given_count int, received_count int)
language sql stable as $$
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
language sql stable as $$
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
language sql stable as $$
  select m.id, m.happened_at, m.description, m.person_id, m.category_id
  from moments m
  where m.user_id = _user and m.significance = true
    and m.happened_at >= _from and m.happened_at < _to
  order by m.happened_at desc
  limit 20;
$$;

create or replace function public.compute_streak(_user uuid)
returns table(current int, best int, last_entry_date date)
language plpgsql stable as $$
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