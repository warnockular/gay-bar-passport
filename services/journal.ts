import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type JournalPhoto = Tables<"journal_photos"> & {
  signedUrl: string | null;
};

export type JournalEntryWithRelations = Tables<"journal_entries"> & {
  favorite?: (Tables<"favorites"> & { venues?: Pick<Tables<"venues">, "name" | "slug" | "city" | "country"> | null }) | null;
  photos: JournalPhoto[];
  venue?: Pick<Tables<"venues">, "id" | "name" | "slug" | "city" | "city_slug" | "country" | "country_slug" | "category" | "image_url"> | null;
  visit?: (Tables<"visits"> & { venues?: Pick<Tables<"venues">, "name" | "slug" | "city" | "country"> | null }) | null;
};

export type JournalFormOptions = {
  favorites: Array<Tables<"favorites"> & { venues?: Pick<Tables<"venues">, "name" | "slug" | "city" | "country" | "city_slug" | "country_slug"> | null }>;
  venues: Array<Pick<Tables<"venues">, "id" | "name" | "slug" | "city" | "city_slug" | "country" | "country_slug">>;
  visits: Array<Tables<"visits"> & { venues?: Pick<Tables<"venues">, "name" | "slug" | "city" | "city_slug" | "country" | "country_slug"> | null }>;
};

type JournalRow = Tables<"journal_entries"> & {
  favorites?: JournalEntryWithRelations["favorite"];
  journal_photos?: Tables<"journal_photos">[] | null;
  venues?: JournalEntryWithRelations["venue"];
  visits?: JournalEntryWithRelations["visit"];
};

async function signJournalPhotos(photos: Tables<"journal_photos">[]) {
  if (!photos.length) return [];

  const supabase = await createSupabaseServerClient();
  return Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage.from("journal-photos").createSignedUrl(photo.storage_path, 60 * 10);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );
}

async function mapJournalRow(row: JournalRow): Promise<JournalEntryWithRelations> {
  return {
    ...row,
    favorite: row.favorites ?? null,
    photos: await signJournalPhotos(row.journal_photos ?? []),
    venue: row.venues ?? null,
    visit: row.visits ?? null
  };
}

export async function listJournalEntries(userId: string, filters: { citySlug?: string; countrySlug?: string } = {}) {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("journal_entries")
    .select("*, venues(id, name, slug, city, city_slug, country, country_slug, category, image_url), visits(*, venues(name, slug, city, country)), favorites(*, venues(name, slug, city, country)), journal_photos(*)")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.countrySlug) query = query.eq("country_slug", filters.countrySlug);
  if (filters.citySlug) query = query.eq("city_slug", filters.citySlug);

  const { data, error } = await query;
  if (error) return [];

  return Promise.all(((data ?? []) as JournalRow[]).map((row) => mapJournalRow(row)));
}

export async function getJournalEntry(userId: string, entryId: string) {
  const entries = await listJournalEntries(userId);
  return entries.find((entry) => entry.id === entryId) ?? null;
}

export async function listJournalDestinations(userId: string) {
  const entries = await listJournalEntries(userId);
  const countries = new Map<string, { cities: Map<string, { count: number; name: string; slug: string }>; count: number; name: string; slug: string }>();

  entries.forEach((entry) => {
    if (!entry.country_slug || !entry.country || !entry.city_slug || !entry.city) return;
    const country = countries.get(entry.country_slug) ?? { cities: new Map(), count: 0, name: entry.country, slug: entry.country_slug };
    const city = country.cities.get(entry.city_slug) ?? { count: 0, name: entry.city, slug: entry.city_slug };
    country.count += 1;
    city.count += 1;
    country.cities.set(entry.city_slug, city);
    countries.set(entry.country_slug, country);
  });

  return Array.from(countries.values()).map((country) => ({
    ...country,
    cities: Array.from(country.cities.values()).sort((a, b) => a.name.localeCompare(b.name))
  }));
}

export async function getJournalFormOptions(userId: string): Promise<JournalFormOptions> {
  if (!isSupabaseConfigured) return { favorites: [], venues: [], visits: [] };

  const supabase = await createSupabaseServerClient();
  const [venues, visits, favorites] = await Promise.all([
    supabase.from("venues").select("id, name, slug, city, city_slug, country, country_slug").eq("is_published", true).order("name"),
    supabase.from("visits").select("*, venues(name, slug, city, city_slug, country, country_slug)").eq("user_id", userId).order("visited_on", { ascending: false }),
    supabase.from("favorites").select("*, venues(name, slug, city, city_slug, country, country_slug)").eq("user_id", userId).order("created_at", { ascending: false })
  ]);

  return {
    favorites: (favorites.data ?? []) as JournalFormOptions["favorites"],
    venues: (venues.data ?? []) as JournalFormOptions["venues"],
    visits: (visits.data ?? []) as JournalFormOptions["visits"]
  };
}
