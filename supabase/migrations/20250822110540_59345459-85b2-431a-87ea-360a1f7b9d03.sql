-- Fix remaining function search path issue for handle_new_user function
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
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