-- Phase 11G venue ownership claims.
-- Creates a moderation queue for owner claim requests without changing existing venue storage.

do $$
begin
  create type public.venue_claim_status as enum (
    'pending',
    'approved',
    'rejected',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.venue_claims (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  status public.venue_claim_status not null default 'pending',
  claimant_name text not null,
  claimant_email text not null,
  role_title text,
  evidence_url text,
  notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venue_claims_venue_status_idx on public.venue_claims (venue_id, status);
create index if not exists venue_claims_claimant_idx on public.venue_claims (claimant_id, created_at desc);
create index if not exists venue_claims_status_idx on public.venue_claims (status, created_at desc);

create unique index if not exists venue_claims_one_pending_per_user_venue_idx
  on public.venue_claims (venue_id, claimant_id)
  where status = 'pending';

drop trigger if exists venue_claims_set_updated_at on public.venue_claims;
create trigger venue_claims_set_updated_at
before update on public.venue_claims
for each row execute function public.set_updated_at();

alter table public.venue_claims enable row level security;

drop policy if exists "Users can read own venue claims" on public.venue_claims;
create policy "Users can read own venue claims"
on public.venue_claims for select
using (auth.uid() = claimant_id);

drop policy if exists "Users can create own venue claims" on public.venue_claims;
create policy "Users can create own venue claims"
on public.venue_claims for insert
with check (auth.uid() = claimant_id and status = 'pending');

drop policy if exists "Admins can read venue claims" on public.venue_claims;
create policy "Admins can read venue claims"
on public.venue_claims for select
using (public.is_admin_role());

drop policy if exists "Admins can update venue claims" on public.venue_claims;
create policy "Admins can update venue claims"
on public.venue_claims for update
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Users can insert own venue claim audit logs" on public.audit_logs;
create policy "Users can insert own venue claim audit logs"
on public.audit_logs for insert
with check (
  auth.uid() = actor_id
  and action = 'venue_claim_requested'
  and target_type = 'venue_claim'
);
