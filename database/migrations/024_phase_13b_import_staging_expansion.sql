-- Phase 13B import staging expansion.
-- Adds provider-grade staging fields without promoting staged rows into public venues.

alter table public.venue_import_staging
  add column if not exists source_url text,
  add column if not exists last_seen_at timestamptz,
  add column if not exists confidence_score integer,
  add column if not exists suggested_category text,
  add column if not exists suggested_tags text[] not null default '{}'::text[],
  add column if not exists phone text,
  add column if not exists postal_code text,
  add column if not exists address_components jsonb not null default '{}'::jsonb,
  add column if not exists matched_venue_id uuid references public.venues(id) on delete set null;

alter table public.venue_import_staging
  drop constraint if exists venue_import_staging_confidence_score_range,
  add constraint venue_import_staging_confidence_score_range
  check (confidence_score is null or confidence_score between 0 and 100);

create index if not exists venue_import_staging_status_idx
  on public.venue_import_staging (approval_status, duplicate_review_status, created_at desc);

create index if not exists venue_import_staging_matched_venue_idx
  on public.venue_import_staging (matched_venue_id)
  where matched_venue_id is not null;

create index if not exists venue_import_staging_confidence_score_idx
  on public.venue_import_staging (confidence_score desc nulls last, created_at desc);

create index if not exists venue_import_staging_last_seen_idx
  on public.venue_import_staging (last_seen_at desc nulls last);
