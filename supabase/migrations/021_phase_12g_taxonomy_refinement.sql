-- Phase 12G taxonomy refinement: controlled nightlife category/tag additions.

alter type public.venue_category add value if not exists 'strip_club';

insert into public.tags (name, slug) values
  ('Men-only', 'men-only')
on conflict (slug) do update set
  name = excluded.name;
