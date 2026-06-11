-- Phase 5 visit logging, photos, passport stamps, and basic achievements.

create table if not exists public.visit_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  visit_id uuid not null references public.visits(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create unique index if not exists passport_stamps_visit_id_unique_idx on public.passport_stamps (visit_id) where visit_id is not null;
create index if not exists visit_photos_user_visit_idx on public.visit_photos (user_id, visit_id);
create index if not exists user_achievements_user_id_idx on public.user_achievements (user_id, awarded_at desc);

insert into public.achievements (code, name, description) values
  ('first_visit', 'First Visit', 'Log your first venue visit.'),
  ('first_favorite', 'First Favorite', 'Save your first favorite venue.'),
  ('five_venues_visited', '5 Venues Visited', 'Visit five different venues.'),
  ('first_international_visit', 'First International Visit', 'Log a visit outside your profile home country or after visiting more than one country.'),
  ('lisbon_explorer', 'Lisbon Explorer', 'Log a visit in Lisbon.')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description;

alter table public.visit_photos enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

drop policy if exists "Visit photos are readable by owner" on public.visit_photos;
create policy "Visit photos are readable by owner"
on public.visit_photos for select
using (auth.uid() = user_id);

drop policy if exists "Visit photos are insertable by owner" on public.visit_photos;
create policy "Visit photos are insertable by owner"
on public.visit_photos for insert
with check (auth.uid() = user_id);

drop policy if exists "Visit photos are deletable by owner" on public.visit_photos;
create policy "Visit photos are deletable by owner"
on public.visit_photos for delete
using (auth.uid() = user_id);

drop policy if exists "Achievements are readable by everyone" on public.achievements;
create policy "Achievements are readable by everyone"
on public.achievements for select
using (true);

drop policy if exists "User achievements are readable by owner" on public.user_achievements;
create policy "User achievements are readable by owner"
on public.user_achievements for select
using (auth.uid() = user_id);

drop policy if exists "User achievements are insertable by owner" on public.user_achievements;
create policy "User achievements are insertable by owner"
on public.user_achievements for insert
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', false)
on conflict (id) do nothing;

drop policy if exists "Visit photos storage readable by owner" on storage.objects;
create policy "Visit photos storage readable by owner"
on storage.objects for select
using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Visit photos storage insertable by owner" on storage.objects;
create policy "Visit photos storage insertable by owner"
on storage.objects for insert
with check (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Visit photos storage deletable by owner" on storage.objects;
create policy "Visit photos storage deletable by owner"
on storage.objects for delete
using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
