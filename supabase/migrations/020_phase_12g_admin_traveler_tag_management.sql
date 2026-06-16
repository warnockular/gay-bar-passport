-- Phase 12G: Admin traveler tag management for public venue cards.

insert into public.tags (name, slug) values
  ('Dancing', 'dancing'),
  ('Late night', 'late-night'),
  ('Cocktails', 'cocktails'),
  ('Quiet conversation', 'quiet-conversation'),
  ('LGBTQ+ owned', 'lgbtq-owned'),
  ('Drag', 'drag'),
  ('Leather', 'leather'),
  ('Bear', 'bear'),
  ('Outdoor space', 'outdoor-space'),
  ('Food', 'food'),
  ('Live music', 'live-music'),
  ('Community', 'community')
on conflict (slug) do update set
  name = excluded.name;

drop policy if exists "Admins can manage tags" on public.tags;
create policy "Admins can manage tags"
on public.tags for all
using (public.is_admin_role())
with check (public.is_admin_role());

drop policy if exists "Admins can manage venue tags" on public.venue_tags;
create policy "Admins can manage venue tags"
on public.venue_tags for all
using (public.is_admin_role())
with check (public.is_admin_role());
