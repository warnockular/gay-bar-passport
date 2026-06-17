-- Phase 12H.1: clear venue moderation lifecycle states.

alter table public.venues
  drop constraint if exists venues_review_status_check;

update public.venues
set review_status = case
  when archived_at is not null then 'archived'
  when review_status = 'hidden' then 'needs_review'
  else review_status
end;

alter table public.venues
  add constraint venues_review_status_check
  check (review_status in ('active', 'hidden', 'pending_review', 'needs_review', 'archived', 'rejected'));

create index if not exists venues_review_lifecycle_idx on public.venues (review_status, archived_at, is_published);
