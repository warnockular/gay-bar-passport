-- Phase 12A community venue submission RLS fix.
-- Authenticated users may insert only their own unpublished community submissions.

alter table public.venues
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null;

create index if not exists venues_submitted_by_idx on public.venues (submitted_by, created_at desc) where submitted_by is not null;

drop policy if exists "Users can submit venues for review" on public.venues;
create policy "Users can submit venues for review"
on public.venues for insert
to authenticated
with check (
  auth.uid() is not null
  and submitted_by = auth.uid()
  and is_published = false
  and review_status = 'pending_review'
  and verification_status = 'unverified'
  and verification_score = 0
  and submission_status = 'community_submitted'
  and source = 'community_submission'
  and claimed_by is null
  and claimed_at is null
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Users can insert own venue submission audit logs" on public.audit_logs;
create policy "Users can insert own venue submission audit logs"
on public.audit_logs for insert
to authenticated
with check (
  auth.uid() = actor_id
  and action = 'venue_community_submitted'
  and target_type = 'venue'
);
