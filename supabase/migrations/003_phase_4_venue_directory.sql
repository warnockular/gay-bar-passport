-- Phase 4 venue directory: curated venue browsing, tags, and user favorites.

alter table public.venues
  add column if not exists neighborhood text,
  add column if not exists address text,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists country_slug text,
  add column if not exists city_slug text;

update public.venues set
  country_slug = lower(regexp_replace(country, '[^a-zA-Z0-9]+', '-', 'g')),
  city_slug = lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g'))
where country_slug is null or city_slug is null;

alter table public.venues
  alter column country_slug set not null,
  alter column city_slug set not null;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.venue_tags (
  venue_id uuid not null references public.venues(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (venue_id, tag_id)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, venue_id)
);

create index if not exists venues_country_city_slug_idx on public.venues (country_slug, city_slug);
create index if not exists venues_category_idx on public.venues (category);
create index if not exists tags_slug_idx on public.tags (slug);
create index if not exists favorites_user_id_idx on public.favorites (user_id, created_at desc);

alter table public.tags enable row level security;
alter table public.venue_tags enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Tags are readable by everyone" on public.tags;
create policy "Tags are readable by everyone"
on public.tags for select
using (true);

drop policy if exists "Venue tags are readable by everyone" on public.venue_tags;
create policy "Venue tags are readable by everyone"
on public.venue_tags for select
using (true);

drop policy if exists "Favorites are readable by owner" on public.favorites;
create policy "Favorites are readable by owner"
on public.favorites for select
using (auth.uid() = user_id);

drop policy if exists "Favorites are insertable by owner" on public.favorites;
create policy "Favorites are insertable by owner"
on public.favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "Favorites are deletable by owner" on public.favorites;
create policy "Favorites are deletable by owner"
on public.favorites for delete
using (auth.uid() = user_id);

insert into public.venues (
  name, slug, city, region, country, country_slug, city_slug, category,
  description, neighborhood, address, website_url, image_url,
  latitude, longitude, is_lgbtq_owned, is_published
) values
  (
    'Velvet Atlas', 'velvet-atlas-lisbon', 'Lisbon', 'Lisboa', 'Portugal', 'portugal', 'lisbon', 'lounge',
    'A design-forward queer lounge for late aperitifs, soft conversation, and golden-hour city notes.',
    'Principe Real', 'Rua da Palmeira, Lisbon', 'https://example.com/velvet-atlas',
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85',
    38.715000, -9.148000, true, true
  ),
  (
    'Sage Room', 'sage-room-mexico-city', 'Mexico City', 'CDMX', 'Mexico', 'mexico', 'mexico-city', 'bar',
    'A leafy neighborhood cocktail bar with intimate lighting, artful mezcal, and a generous queer crowd.',
    'Roma Norte', 'Colima, Roma Norte, Mexico City', 'https://example.com/sage-room',
    'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=85',
    19.420000, -99.164000, false, true
  ),
  (
    'The Terracotta Bar', 'the-terracotta-bar-copenhagen', 'Copenhagen', 'Capital Region', 'Denmark', 'denmark', 'copenhagen', 'bar',
    'A polished canal-side room with warm service, low brass light, and an easy intergenerational scene.',
    'Indre By', 'Studiestraede, Copenhagen', 'https://example.com/terracotta-bar',
    'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=85',
    55.678000, 12.571000, true, true
  ),
  (
    'Rose Archive', 'rose-archive-berlin', 'Berlin', 'Berlin', 'Germany', 'germany', 'berlin', 'performance',
    'An editorial-feeling performance salon with drag, readings, and late-night dance floor essays.',
    'Kreuzberg', 'Oranienstrasse, Berlin', 'https://example.com/rose-archive',
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85',
    52.501000, 13.421000, true, true
  ),
  (
    'Marigold Social', 'marigold-social-toronto', 'Toronto', 'Ontario', 'Canada', 'canada', 'toronto', 'club',
    'A refined village club with guest DJs, bottle-green banquettes, and a celebratory weekend pulse.',
    'Church-Wellesley Village', 'Church Street, Toronto', 'https://example.com/marigold-social',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85',
    43.665000, -79.381000, false, true
  ),
  (
    'Harbor House', 'harbor-house-sydney', 'Sydney', 'New South Wales', 'Australia', 'australia', 'sydney', 'community',
    'A community-forward queer cafe and gathering room near the harbor, built for day plans and first meetings.',
    'Darlinghurst', 'Oxford Street, Sydney', 'https://example.com/harbor-house',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85',
    -33.879000, 151.215000, true, true
  )
on conflict (slug) do update set
  description = excluded.description,
  neighborhood = excluded.neighborhood,
  address = excluded.address,
  website_url = excluded.website_url,
  image_url = excluded.image_url,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  country_slug = excluded.country_slug,
  city_slug = excluded.city_slug,
  is_published = excluded.is_published;

insert into public.tags (name, slug) values
  ('Cocktails', 'cocktails'),
  ('Dancing', 'dancing'),
  ('Drag', 'drag'),
  ('Community', 'community'),
  ('LGBTQ+ owned', 'lgbtq-owned'),
  ('Quiet conversation', 'quiet-conversation'),
  ('Late night', 'late-night'),
  ('Cafe', 'cafe')
on conflict (slug) do nothing;

insert into public.venue_tags (venue_id, tag_id)
select v.id, t.id
from public.venues v
join public.tags t on t.slug = any (
  case v.slug
    when 'velvet-atlas-lisbon' then array['cocktails', 'lgbtq-owned', 'quiet-conversation']
    when 'sage-room-mexico-city' then array['cocktails', 'quiet-conversation']
    when 'the-terracotta-bar-copenhagen' then array['cocktails', 'lgbtq-owned', 'late-night']
    when 'rose-archive-berlin' then array['drag', 'dancing', 'late-night']
    when 'marigold-social-toronto' then array['dancing', 'late-night']
    when 'harbor-house-sydney' then array['community', 'cafe', 'lgbtq-owned']
    else array[]::text[]
  end
)
on conflict do nothing;
