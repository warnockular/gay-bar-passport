-- Phase 13D.1 fix: allow admin/moderator approval of staged import candidates.
-- This permits only unpublished, pending-review imported venues and does not alter public/community writes.

drop policy if exists "Admins can insert imported venues" on public.venues;
create policy "Admins can insert imported venues"
on public.venues for insert
to authenticated
with check (
  public.is_admin_role()
  and source = 'imported'
  and submission_status = 'imported'
  and review_status = 'pending_review'
  and verification_status = 'unverified'
  and verification_score = 0
  and is_published = false
  and submitted_by is null
  and reviewed_by is null
  and reviewed_at is null
);
