-- Optional development seed data.
-- These venues are public placeholders so the app has something elegant to display before real curation.

insert into public.venues (
  name,
  slug,
  city,
  region,
  country,
  category,
  description,
  image_url,
  is_lgbtq_owned,
  is_published
) values
  (
    'Velvet Atlas',
    'velvet-atlas-lisbon',
    'Lisbon',
    'Lisboa',
    'Portugal',
    'lounge',
    'A warm, design-forward lounge for late aperitifs and quiet city notes.',
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85',
    true,
    true
  ),
  (
    'Sage Room',
    'sage-room-mexico-city',
    'Mexico City',
    'CDMX',
    'Mexico',
    'bar',
    'A leafy neighborhood bar with elegant cocktails and an intimate queer crowd.',
    'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=85',
    false,
    true
  ),
  (
    'The Terracotta Bar',
    'the-terracotta-bar-copenhagen',
    'Copenhagen',
    'Capital Region',
    'Denmark',
    'bar',
    'A polished canal-side room with soft lighting, sharp service, and room to linger.',
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=85',
    true,
    true
  )
on conflict (slug) do nothing;
