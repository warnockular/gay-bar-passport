-- Phase 12K.1 Montreal taxonomy refinement: add focused venue categories and traveler tags.

alter type public.venue_category add value if not exists 'restaurant';
alter type public.venue_category add value if not exists 'bathhouse_sauna';
alter type public.venue_category add value if not exists 'retail_bookstore';
alter type public.venue_category add value if not exists 'cultural_historic_site';

insert into public.tags (name, slug) values
  ('Karaoke', 'karaoke'),
  ('Dance Floor', 'dance-floor'),
  ('Patio', 'patio'),
  ('Happy Hour', 'happy-hour'),
  ('Tourist Friendly', 'tourist-friendly'),
  ('Accessible Entrance', 'accessible-entrance')
on conflict (slug) do update set
  name = excluded.name;
