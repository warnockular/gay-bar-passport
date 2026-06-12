-- Phase 12A community venue submission visibility fix.
-- Keeps public visibility restricted while allowing submitters and admins to read pending submissions.

drop policy if exists "Admins can read all venues" on public.venues;
create policy "Admins can read all venues"
on public.venues for select
to authenticated
using (public.is_admin_role());

drop policy if exists "Users can read own venue submissions" on public.venues;
create policy "Users can read own venue submissions"
on public.venues for select
to authenticated
using (
  submitted_by = auth.uid()
  and is_published = false
  and submission_status = 'community_submitted'
);
