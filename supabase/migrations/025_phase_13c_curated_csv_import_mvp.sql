-- Phase 13C curated CSV import MVP.
-- Stores batch-level CSV result counts and invalid row details without promoting staged rows.

alter table public.import_batches
  add column if not exists total_count integer not null default 0 check (total_count >= 0),
  add column if not exists staged_count integer not null default 0 check (staged_count >= 0),
  add column if not exists invalid_count integer not null default 0 check (invalid_count >= 0),
  add column if not exists error_details jsonb not null default '[]'::jsonb;

create index if not exists import_batches_csv_counts_idx
  on public.import_batches (status, staged_count desc, invalid_count desc, created_at desc);
