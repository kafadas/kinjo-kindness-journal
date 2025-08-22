-- 1A) Categories: prevent duplicate slugs per user
alter table public.categories
  add constraint categories_user_slug_unique unique (user_id, slug);

-- 1B) People names: allow duplicates if you want (common), but at least index for search
create index if not exists idx_people_user_display_name
  on public.people (user_id, display_name);

-- 1C) Groups: de-dupe per user by name (optional but recommended)
alter table public.groups
  add constraint groups_user_name_unique unique (user_id, name);

-- 1D) Attachments: fast lookups
create index if not exists idx_attachments_user_moment
  on public.attachments (user_id, moment_id);

-- 1E) Moments: the workhorse indexes
create index if not exists idx_moments_user_happened
  on public.moments (user_id, happened_at desc);

create index if not exists idx_moments_user_person
  on public.moments (user_id, person_id);

create index if not exists idx_moments_user_category
  on public.moments (user_id, category_id);

-- 1F) Tags search (text[]): GIN index (optional, enables tag filters)
create index if not exists idx_moments_tags_gin
  on public.moments using gin (tags);

-- create if missing
do $$
begin
  if not exists (select 1 from pg_type where typname = 'action_t') then
    create type action_t as enum ('given', 'received');
  end if;
end $$;

-- ensure column uses it
alter table public.moments
  alter column action type action_t using action::text::action_t;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_moments_set_updated_at on public.moments;
create trigger trg_moments_set_updated_at
before update on public.moments
for each row execute function set_updated_at();

-- person_groups: allow a user only if they own BOTH sides
-- (read)
create policy person_groups_select on public.person_groups
for select using (
  exists (select 1 from public.people p where p.id = person_id and p.user_id = auth.uid())
  and
  exists (select 1 from public.groups g where g.id = group_id and g.user_id = auth.uid())
);

-- (insert)
create policy person_groups_insert on public.person_groups
for insert with check (
  exists (select 1 from public.people p where p.id = person_id and p.user_id = auth.uid())
  and
  exists (select 1 from public.groups g where g.id = group_id and g.user_id = auth.uid())
);

-- prompts: readable if global (user_id is null) or owned
create policy prompts_select on public.prompts
for select using (user_id is null or user_id = auth.uid());