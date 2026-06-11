-- Phase 7 follow-up: social feeds need signed-in users to read public journal entries.

drop policy if exists "Public journal entries are readable by signed in users" on public.journal_entries;
create policy "Public journal entries are readable by signed in users"
on public.journal_entries for select
using (auth.uid() is not null and is_private = false);
