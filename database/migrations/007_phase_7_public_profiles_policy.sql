-- Phase 7 follow-up: public profile discovery needs signed-in users to read profile cards.

drop policy if exists "Profiles are readable by signed in users" on public.profiles;
create policy "Profiles are readable by signed in users"
on public.profiles for select
using (auth.uid() is not null);
