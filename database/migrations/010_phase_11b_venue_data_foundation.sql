-- Phase 11B venue data foundation: verification, source tracking, submissions, and future claims.
-- This does not import venue data or add claim/import workflows.

do $$
begin
  create type public.venue_verification_status as enum (
    'unverified',
    'community_verified',
    'owner_verified',
    'admin_verified'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.venue_identity_classification as enum (
    'lgbtq_venue',
    'lgbtq_friendly',
    'historic_site',
    'community_recommended'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.venue_submission_status as enum (
    'imported',
    'community_submitted',
    'owner_submitted',
    'admin_created'
  );
exception
  when duplicate_object then null;
end $$;

alter table public.venues
  add column if not exists verification_score integer not null default 0,
  add column if not exists verification_status public.venue_verification_status not null default 'unverified',
  add column if not exists identity_classification public.venue_identity_classification not null default 'lgbtq_venue',
  add column if not exists source text,
  add column if not exists source_id text,
  add column if not exists submission_status public.venue_submission_status not null default 'admin_created',
  add column if not exists claimed_by uuid references public.profiles(id) on delete set null,
  add column if not exists claimed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz;

alter table public.venues
  drop constraint if exists venues_verification_score_range,
  add constraint venues_verification_score_range check (verification_score between 0 and 100);

create index if not exists venues_verification_status_idx on public.venues (verification_status);
create index if not exists venues_identity_classification_idx on public.venues (identity_classification);
create index if not exists venues_submission_status_idx on public.venues (submission_status);
create index if not exists venues_source_idx on public.venues (source, source_id);
create unique index if not exists venues_source_unique_idx
  on public.venues (source, source_id)
  where source is not null and source_id is not null;
create index if not exists venues_claimed_by_idx on public.venues (claimed_by) where claimed_by is not null;

update public.venues
set
  verification_score = coalesce(verification_score, 0),
  verification_status = coalesce(verification_status, 'unverified'),
  identity_classification = coalesce(identity_classification, 'lgbtq_venue'),
  submission_status = coalesce(submission_status, 'admin_created')
where true;
