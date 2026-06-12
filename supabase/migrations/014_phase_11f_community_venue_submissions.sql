-- Phase 11F community venue submissions.
-- Allows authenticated users to create unpublished, pending venue submissions only.

drop policy if exists "Users can submit venues for review" on public.venues;
create policy "Users can submit venues for review"
on public.venues for insert
with check (
  auth.uid() is not null
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
with check (
  auth.uid() = actor_id
  and action = 'venue_community_submitted'
  and target_type = 'venue'
);
