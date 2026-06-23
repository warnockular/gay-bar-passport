-- Phase 13D.3 staged import candidate editing.
-- Tracks admin cleanup without changing the original raw import payload.

alter table public.venue_import_staging
  add column if not exists edited_by uuid references public.profiles(id) on delete set null,
  add column if not exists edited_at timestamptz;

create index if not exists venue_import_staging_edited_at_idx
  on public.venue_import_staging (edited_at desc nulls last)
  where edited_at is not null;
