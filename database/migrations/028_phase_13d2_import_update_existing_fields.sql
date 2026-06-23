-- Phase 13D.2 import enrichment fields.
-- Adds safe operational fields that imported candidates may update on existing venues.

alter table public.venues
  add column if not exists phone text,
  add column if not exists postal_code text;

create index if not exists venues_phone_idx on public.venues (phone) where phone is not null;
create index if not exists venues_postal_code_idx on public.venues (postal_code) where postal_code is not null;
