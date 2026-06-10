-- Phase 2 database foundation for Gay Bar Passport.
-- Run this in Supabase SQL editor or through the Supabase CLI once a project is created.

create extension if not exists "pgcrypto";

create type public.venue_category as enum (
  'bar',
  'club',
  'lounge',
  'cafe',
  'performance',
  'community'
);

create type public.visit_mood as enum (
  'iconic',
  'intimate',
  'social',
  'romantic',
  'high_energy',
  'reflective'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  region text,
  country text not null,
  category public.venue_category not null default 'bar',
  description text,
  image_url text,
  website_url text,
  is_lgbtq_owned boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  visited_on date not null,
  mood public.visit_mood,
  rating integer check (rating between 1 and 5),
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, venue_id, visited_on)
);

create table public.passport_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  visit_id uuid references public.visits(id) on delete set null,
  city text not null,
  country text not null,
  stamp_code text not null,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  title text not null,
  body text,
  entry_date date not null default current_date,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index venues_city_country_idx on public.venues (city, country);
create index visits_user_id_visited_on_idx on public.visits (user_id, visited_on desc);
create index passport_stamps_user_id_issued_at_idx on public.passport_stamps (user_id, issued_at desc);
create index journal_entries_user_id_entry_date_idx on public.journal_entries (user_id, entry_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger venues_set_updated_at
before update on public.venues
for each row execute function public.set_updated_at();

create trigger visits_set_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

create trigger journal_entries_set_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.visits enable row level security;
alter table public.passport_stamps enable row level security;
alter table public.journal_entries enable row level security;

create policy "Profiles are readable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are editable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Published venues are readable by everyone"
on public.venues for select
using (is_published = true);

create policy "Visits are readable by owner"
on public.visits for select
using (auth.uid() = user_id);

create policy "Visits are insertable by owner"
on public.visits for insert
with check (auth.uid() = user_id);

create policy "Visits are editable by owner"
on public.visits for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Visits are deletable by owner"
on public.visits for delete
using (auth.uid() = user_id);

create policy "Passport stamps are readable by owner"
on public.passport_stamps for select
using (auth.uid() = user_id);

create policy "Passport stamps are insertable by owner"
on public.passport_stamps for insert
with check (auth.uid() = user_id);

create policy "Journal entries are readable by owner"
on public.journal_entries for select
using (auth.uid() = user_id);

create policy "Journal entries are insertable by owner"
on public.journal_entries for insert
with check (auth.uid() = user_id);

create policy "Journal entries are editable by owner"
on public.journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Journal entries are deletable by owner"
on public.journal_entries for delete
using (auth.uid() = user_id);
