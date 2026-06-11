-- Phase 6 travel journal: destination-aware entries and private journal photos.

alter table public.journal_entries
  add column if not exists country text,
  add column if not exists country_slug text,
  add column if not exists city text,
  add column if not exists city_slug text,
  add column if not exists venue_id uuid references public.venues(id) on delete set null,
  add column if not exists favorite_id uuid references public.favorites(id) on delete set null;

create table if not exists public.journal_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_id uuid not null references public.journal_entries(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_user_destination_idx on public.journal_entries (user_id, country_slug, city_slug, entry_date desc);
create index if not exists journal_entries_user_venue_idx on public.journal_entries (user_id, venue_id);
create index if not exists journal_photos_user_entry_idx on public.journal_photos (user_id, entry_id);

alter table public.journal_photos enable row level security;

drop policy if exists "Journal photos are readable by owner" on public.journal_photos;
create policy "Journal photos are readable by owner"
on public.journal_photos for select
using (auth.uid() = user_id);

drop policy if exists "Journal photos are insertable by owner" on public.journal_photos;
create policy "Journal photos are insertable by owner"
on public.journal_photos for insert
with check (auth.uid() = user_id);

drop policy if exists "Journal photos are deletable by owner" on public.journal_photos;
create policy "Journal photos are deletable by owner"
on public.journal_photos for delete
using (auth.uid() = user_id);

drop policy if exists "Journal entries are deletable by owner" on public.journal_entries;
create policy "Journal entries are deletable by owner"
on public.journal_entries for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

drop policy if exists "Journal photos storage readable by owner" on storage.objects;
create policy "Journal photos storage readable by owner"
on storage.objects for select
using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Journal photos storage insertable by owner" on storage.objects;
create policy "Journal photos storage insertable by owner"
on storage.objects for insert
with check (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Journal photos storage deletable by owner" on storage.objects;
create policy "Journal photos storage deletable by owner"
on storage.objects for delete
using (bucket_id = 'journal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
