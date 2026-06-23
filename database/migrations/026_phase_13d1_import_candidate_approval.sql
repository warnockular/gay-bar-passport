-- Phase 13D.1 imported candidate review lifecycle.
-- Keeps staged candidates after approval while linking them to the created venue.

alter type public.import_approval_status add value if not exists 'archived';

alter table public.venue_import_staging
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_venue_id uuid references public.venues(id) on delete set null;

create index if not exists venue_import_staging_approved_venue_idx
  on public.venue_import_staging (approved_venue_id)
  where approved_venue_id is not null;

create index if not exists venue_import_staging_approval_lifecycle_idx
  on public.venue_import_staging (approval_status, approved_at desc nulls last, reviewed_at desc nulls last);
