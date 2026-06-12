import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unsplashImages } from "@/services/unsplash";
import type { Enums, Tables } from "@/types/database";

export type VenueTag = Pick<Tables<"tags">, "id" | "name" | "slug">;
export type VenueWithTags = Tables<"venues"> & {
  tags: VenueTag[];
};

export type VenueFilters = {
  category?: Enums<"venue_category">;
  citySlug?: string;
  countrySlug?: string;
  query?: string;
  tag?: string;
};

type VenueTagJoin = {
  tags: VenueTag | null;
};

const createdAt = new Date(0).toISOString();
const venueDataFoundationDefaults = {
  archived_at: null,
  archived_by: null,
  claimed_at: null,
  claimed_by: null,
  completeness_score: 0,
  featured: false,
  featured_at: null,
  merge_notes: null,
  merged_into_venue_id: null,
  identity_classification: "lgbtq_venue" as const,
  missing_data: [] as string[],
  opening_hours: null,
  readiness_status: "incomplete" as const,
  reviewed_at: null,
  reviewed_by: null,
  source: null,
  source_id: null,
  submission_status: "admin_created" as const,
  verification_score: 0,
  verification_status: "unverified" as const
};

export const fallbackVenues: VenueWithTags[] = [
  {
    id: "phase-4-velvet-atlas",
    name: "Velvet Atlas",
    slug: "velvet-atlas-lisbon",
    city: "Lisbon",
    city_slug: "lisbon",
    region: "Lisboa",
    country: "Portugal",
    country_slug: "portugal",
    category: "lounge",
    description: "A design-forward queer lounge for late aperitifs, soft conversation, and golden-hour city notes.",
    neighborhood: "Principe Real",
    address: "Rua da Palmeira, Lisbon",
    latitude: 38.715,
    longitude: -9.148,
    image_url: unsplashImages.lisbon.src,
    website_url: "https://example.com/velvet-atlas",
    is_lgbtq_owned: true,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-cocktails", name: "Cocktails", slug: "cocktails" },
      { id: "tag-owned", name: "LGBTQ+ owned", slug: "lgbtq-owned" },
      { id: "tag-quiet", name: "Quiet conversation", slug: "quiet-conversation" }
    ]
  },
  {
    id: "phase-4-sage-room",
    name: "Sage Room",
    slug: "sage-room-mexico-city",
    city: "Mexico City",
    city_slug: "mexico-city",
    region: "CDMX",
    country: "Mexico",
    country_slug: "mexico",
    category: "bar",
    description: "A leafy neighborhood cocktail bar with intimate lighting, artful mezcal, and a generous queer crowd.",
    neighborhood: "Roma Norte",
    address: "Colima, Roma Norte, Mexico City",
    latitude: 19.42,
    longitude: -99.164,
    image_url: unsplashImages.mexicoCity.src,
    website_url: "https://example.com/sage-room",
    is_lgbtq_owned: false,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-cocktails", name: "Cocktails", slug: "cocktails" },
      { id: "tag-quiet", name: "Quiet conversation", slug: "quiet-conversation" }
    ]
  },
  {
    id: "phase-4-terracotta",
    name: "The Terracotta Bar",
    slug: "the-terracotta-bar-copenhagen",
    city: "Copenhagen",
    city_slug: "copenhagen",
    region: "Capital Region",
    country: "Denmark",
    country_slug: "denmark",
    category: "bar",
    description: "A polished canal-side room with warm service, low brass light, and an easy intergenerational scene.",
    neighborhood: "Indre By",
    address: "Studiestraede, Copenhagen",
    latitude: 55.678,
    longitude: 12.571,
    image_url: unsplashImages.copenhagen.src,
    website_url: "https://example.com/terracotta-bar",
    is_lgbtq_owned: true,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-cocktails", name: "Cocktails", slug: "cocktails" },
      { id: "tag-owned", name: "LGBTQ+ owned", slug: "lgbtq-owned" },
      { id: "tag-late", name: "Late night", slug: "late-night" }
    ]
  },
  {
    id: "phase-4-rose-archive",
    name: "Rose Archive",
    slug: "rose-archive-berlin",
    city: "Berlin",
    city_slug: "berlin",
    region: "Berlin",
    country: "Germany",
    country_slug: "germany",
    category: "performance",
    description: "An editorial-feeling performance salon with drag, readings, and late-night dance floor essays.",
    neighborhood: "Kreuzberg",
    address: "Oranienstrasse, Berlin",
    latitude: 52.501,
    longitude: 13.421,
    image_url: "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1200&q=85",
    website_url: "https://example.com/rose-archive",
    is_lgbtq_owned: true,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-drag", name: "Drag", slug: "drag" },
      { id: "tag-dancing", name: "Dancing", slug: "dancing" },
      { id: "tag-late", name: "Late night", slug: "late-night" }
    ]
  },
  {
    id: "phase-4-marigold",
    name: "Marigold Social",
    slug: "marigold-social-toronto",
    city: "Toronto",
    city_slug: "toronto",
    region: "Ontario",
    country: "Canada",
    country_slug: "canada",
    category: "club",
    description: "A refined village club with guest DJs, bottle-green banquettes, and a celebratory weekend pulse.",
    neighborhood: "Church-Wellesley Village",
    address: "Church Street, Toronto",
    latitude: 43.665,
    longitude: -79.381,
    image_url: unsplashImages.interior.src,
    website_url: "https://example.com/marigold-social",
    is_lgbtq_owned: false,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-dancing", name: "Dancing", slug: "dancing" },
      { id: "tag-late", name: "Late night", slug: "late-night" }
    ]
  },
  {
    id: "phase-4-harbor-house",
    name: "Harbor House",
    slug: "harbor-house-sydney",
    city: "Sydney",
    city_slug: "sydney",
    region: "New South Wales",
    country: "Australia",
    country_slug: "australia",
    category: "community",
    description: "A community-forward queer cafe and gathering room near the harbor, built for day plans and first meetings.",
    neighborhood: "Darlinghurst",
    address: "Oxford Street, Sydney",
    latitude: -33.879,
    longitude: 151.215,
    image_url: unsplashImages.hero.src,
    website_url: "https://example.com/harbor-house",
    is_lgbtq_owned: true,
    is_published: true,
    review_status: "active",
    created_at: createdAt,
    updated_at: createdAt,
    ...venueDataFoundationDefaults,
    tags: [
      { id: "tag-community", name: "Community", slug: "community" },
      { id: "tag-cafe", name: "Cafe", slug: "cafe" },
      { id: "tag-owned", name: "LGBTQ+ owned", slug: "lgbtq-owned" }
    ]
  }
];

function listFallbackTags() {
  return Array.from(new Map(fallbackVenues.flatMap((venue) => venue.tags).map((tag) => [tag.slug, tag])).values()).sort((a, b) => a.name.localeCompare(b.name));
}

function mapVenue(row: Tables<"venues"> & { venue_tags?: VenueTagJoin[] | null }): VenueWithTags {
  return {
    ...row,
    tags: row.venue_tags?.map((join) => join.tags).filter((tag): tag is VenueTag => Boolean(tag)) ?? []
  };
}

function filterFallbackVenues(filters: VenueFilters = {}) {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return fallbackVenues.filter((venue) => {
    const matchesQuery = normalizedQuery
      ? [venue.name, venue.description, venue.city, venue.country, venue.neighborhood].some((value) => value?.toLowerCase().includes(normalizedQuery))
      : true;
    const matchesCategory = filters.category ? venue.category === filters.category : true;
    const matchesTag = filters.tag ? venue.tags.some((tag) => tag.slug === filters.tag) : true;
    const matchesCountry = filters.countrySlug ? venue.country_slug === filters.countrySlug : true;
    const matchesCity = filters.citySlug ? venue.city_slug === filters.citySlug : true;

    return matchesQuery && matchesCategory && matchesTag && matchesCountry && matchesCity;
  });
}

export async function listPublishedVenues(filters: VenueFilters = {}): Promise<VenueWithTags[]> {
  if (!isSupabaseConfigured) {
    return filterFallbackVenues(filters);
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("venues")
    .select("*, venue_tags(tags(id, name, slug))")
    .eq("is_published", true)
    .is("archived_at", null)
    .order("country", { ascending: true })
    .order("city", { ascending: true })
    .order("name", { ascending: true })
    .limit(100);

  if (filters.query) {
    const search = `%${filters.query.trim()}%`;
    query = query.or(`name.ilike.${search},description.ilike.${search},city.ilike.${search},country.ilike.${search},neighborhood.ilike.${search}`);
  }

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.countrySlug) query = query.eq("country_slug", filters.countrySlug);
  if (filters.citySlug) query = query.eq("city_slug", filters.citySlug);

  const { data, error } = await query;

  if (error) {
    return filterFallbackVenues(filters);
  }

  const venues = (data ?? []).map((row) => mapVenue(row));
  return filters.tag ? venues.filter((venue) => venue.tags.some((tag) => tag.slug === filters.tag)) : venues;
}

export async function getVenueBySlug(slug: string) {
  const venues = await listPublishedVenues();
  return venues.find((venue) => venue.slug === slug) ?? null;
}

export async function listTags(): Promise<VenueTag[]> {
  if (!isSupabaseConfigured) {
    return listFallbackTags();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("tags").select("id, name, slug").order("name");

  if (error) {
    return listFallbackTags();
  }

  return data ?? [];
}

export async function listCountries() {
  const venues = await listPublishedVenues();
  return Array.from(new Map(venues.map((venue) => [venue.country_slug, { name: venue.country, slug: venue.country_slug }])).values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listCities(countrySlug?: string) {
  const venues = await listPublishedVenues(countrySlug ? { countrySlug } : {});
  return Array.from(new Map(venues.map((venue) => [venue.city_slug, { name: venue.city, slug: venue.city_slug, country: venue.country, countrySlug: venue.country_slug }])).values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function listFavoriteVenueIds(userId?: string | null) {
  if (!userId || !isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("favorites").select("venue_id").eq("user_id", userId).limit(200);

  if (error) return [];

  const favorites = (data ?? []) as Array<{ venue_id: string }>;
  return favorites.map((favorite) => favorite.venue_id);
}

export async function listFavoriteVenues(userId: string) {
  const favoriteIds = await listFavoriteVenueIds(userId);
  const venues = await listPublishedVenues();
  return venues.filter((venue) => favoriteIds.includes(venue.id));
}
