-- Phase 11D import pipeline foundation: batch tracking and venue import staging only.
-- This does not integrate providers, schedule jobs, or promote staged rows into production venues.

do $$
begin
  create type public.import_batch_status as enum ('pending', 'processing', 'completed', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_duplicate_status as enum ('unique', 'possible_duplicate', 'confirmed_duplicate');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.import_approval_status as enum ('pending', 'approved', 'rejected', 'merged');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  source_name text not null,
  status public.import_batch_status not null default 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  imported_count integer not null default 0 check (imported_count >= 0),
  approved_count integer not null default 0 check (approved_count >= 0),
  rejected_count integer not null default 0 check (rejected_count >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.venue_import_staging (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references public.import_batches(id) on delete cascade,
  raw_data jsonb not null default '{}'::jsonb,
  source text not null,
  source_id text,
  source_metadata jsonb not null default '{}'::jsonb,
  name text,
  city text,
  country text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  duplicate_review_status public.import_duplicate_status not null default 'unique',
  duplicate_existing_venue_id uuid references public.venues(id) on delete set null,
  name_similarity numeric(5,4) check (name_similarity is null or (name_similarity >= 0 and name_similarity <= 1)),
  approval_status public.import_approval_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists import_batches_status_idx on public.import_batches (status, created_at desc);
create index if not exists venue_import_staging_batch_idx on public.venue_import_staging (import_batch_id, approval_status, duplicate_review_status);
create index if not exists venue_import_staging_source_idx on public.venue_import_staging (source, source_id);
create index if not exists venue_import_staging_location_idx on public.venue_import_staging (latitude, longitude);
create index if not exists venue_import_staging_name_idx on public.venue_import_staging (lower(name));

alter table public.import_batches enable row level security;
alter table public.venue_import_staging enable row level security;

drop policy if exists "Admins can manage import batches" on public.import_batches;
create policy "Admins can manage import batches"
on public.import_batches for all
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')))
with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));

drop policy if exists "Admins can manage venue import staging" on public.venue_import_staging;
create policy "Admins can manage venue import staging"
on public.venue_import_staging for all
using (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')))
with check (exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'moderator')));
