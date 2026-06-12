-- Phase 11H duplicate resolution and merge tools.
-- Adds archive metadata and durable merge records for admin-reviewed venue deduplication.

alter table public.venues
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists merged_into_venue_id uuid references public.venues(id) on delete set null,
  add column if not exists merge_notes text;

create index if not exists venues_archived_at_idx on public.venues (archived_at) where archived_at is not null;
create index if not exists venues_merged_into_idx on public.venues (merged_into_venue_id) where merged_into_venue_id is not null;

create table if not exists public.venue_merge_records (
  id uuid primary key default gen_random_uuid(),
  source_venue_id uuid not null references public.venues(id) on delete restrict,
  target_venue_id uuid not null references public.venues(id) on delete restrict,
  merge_reason text,
  preserved_counts jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint venue_merge_records_distinct check (source_venue_id <> target_venue_id)
);

create index if not exists venue_merge_records_source_idx on public.venue_merge_records (source_venue_id, created_at desc);
create index if not exists venue_merge_records_target_idx on public.venue_merge_records (target_venue_id, created_at desc);

alter table public.venue_merge_records enable row level security;

drop policy if exists "Admins can read venue merge records" on public.venue_merge_records;
create policy "Admins can read venue merge records"
on public.venue_merge_records for select
using (public.is_admin_role());

drop policy if exists "Admins can write venue merge records" on public.venue_merge_records;
create policy "Admins can write venue merge records"
on public.venue_merge_records for insert
with check (public.is_admin_role());
