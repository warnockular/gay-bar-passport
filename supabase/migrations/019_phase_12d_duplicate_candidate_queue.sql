-- Phase 12D duplicate candidate queue.
-- Stores system-generated production venue duplicate pairs for admin review.

create table if not exists public.venue_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  venue_a_id uuid not null references public.venues(id) on delete cascade,
  venue_b_id uuid not null references public.venues(id) on delete cascade,
  confidence_score integer not null check (confidence_score between 0 and 100),
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  match_reasons text[] not null default '{}'::text[],
  status text not null default 'pending' check (status in ('pending', 'dismissed', 'merged')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint venue_duplicate_candidates_distinct check (venue_a_id <> venue_b_id)
);

create unique index if not exists venue_duplicate_candidates_pair_unique_idx
  on public.venue_duplicate_candidates (
    least(venue_a_id, venue_b_id),
    greatest(venue_a_id, venue_b_id)
  );

create index if not exists venue_duplicate_candidates_status_idx
  on public.venue_duplicate_candidates (status, confidence_score desc, created_at desc);

drop trigger if exists venue_duplicate_candidates_set_updated_at on public.venue_duplicate_candidates;
create trigger venue_duplicate_candidates_set_updated_at
before update on public.venue_duplicate_candidates
for each row execute function public.set_updated_at();

alter table public.venue_duplicate_candidates enable row level security;

drop policy if exists "Admins can manage duplicate candidates" on public.venue_duplicate_candidates;
create policy "Admins can manage duplicate candidates"
on public.venue_duplicate_candidates for all
using (public.is_admin_role())
with check (public.is_admin_role());
