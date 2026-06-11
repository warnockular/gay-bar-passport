import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AnalyticsBucket = {
  count: number;
  label: string;
  slug?: string;
};

export type AnalyticsVisit = Tables<"visits"> & {
  venue: Pick<Tables<"venues">, "category" | "city" | "city_slug" | "country" | "country_slug" | "id" | "latitude" | "longitude" | "name" | "slug"> | null;
};

export type TravelAnalytics = {
  achievements: number;
  activity: {
    journalsOverTime: AnalyticsBucket[];
    visitsOverTime: AnalyticsBucket[];
  };
  community: {
    activeDestinations: AnalyticsBucket[];
    publicJournalCount: number;
    travelerCount: number;
  };
  countries: AnalyticsBucket[];
  cities: AnalyticsBucket[];
  favorites: number;
  journalEntries: number;
  mostVisitedCity: AnalyticsBucket | null;
  mostVisitedCountry: AnalyticsBucket | null;
  passportStamps: number;
  recentActivity: Array<{ date: string; label: string; type: "journal" | "visit" }>;
  topCategories: AnalyticsBucket[];
  travelStreak: number;
  visits: AnalyticsVisit[];
  venuesVisited: number;
};

type VisitRow = Tables<"visits"> & {
  venues?: AnalyticsVisit["venue"];
};

type JournalSummary = Pick<Tables<"journal_entries">, "city" | "city_slug" | "country" | "country_slug" | "created_at" | "entry_date" | "id" | "title">;

function increment(map: Map<string, AnalyticsBucket>, key: string | null | undefined, label?: string | null, slug?: string | null) {
  if (!key || !label) return;
  const existing = map.get(key) ?? { count: 0, label, slug: slug ?? undefined };
  existing.count += 1;
  map.set(key, existing);
}

function sortedBuckets(map: Map<string, AnalyticsBucket>) {
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function monthLabel(date: string) {
  return new Date(date).toLocaleDateString("en", { month: "short", year: "numeric" });
}

function travelStreak(visits: AnalyticsVisit[]) {
  const days = Array.from(new Set(visits.map((visit) => visit.visited_on))).sort();
  if (!days.length) return 0;

  let longest = 1;
  let current = 1;
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(days[index - 1]);
    const next = new Date(days[index]);
    const diff = Math.round((next.getTime() - previous.getTime()) / 86400000);
    current = diff === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

export async function getTravelAnalytics(userId: string): Promise<TravelAnalytics> {
  const empty: TravelAnalytics = {
    achievements: 0,
    activity: { journalsOverTime: [], visitsOverTime: [] },
    community: { activeDestinations: [], publicJournalCount: 0, travelerCount: 0 },
    countries: [],
    cities: [],
    favorites: 0,
    journalEntries: 0,
    mostVisitedCity: null,
    mostVisitedCountry: null,
    passportStamps: 0,
    recentActivity: [],
    topCategories: [],
    travelStreak: 0,
    visits: [],
    venuesVisited: 0
  };

  if (!isSupabaseConfigured) return empty;

  const supabase = await createSupabaseServerClient();
  const [visitsResult, favoritesResult, stampsResult, achievementsResult, journalsResult, travelerResult, publicJournalResult] = await Promise.all([
    supabase
      .from("visits")
      .select("*, venues(id, name, slug, city, city_slug, country, country_slug, category, latitude, longitude)")
      .eq("user_id", userId)
      .order("visited_on", { ascending: false })
      .limit(500),
    supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("passport_stamps").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("user_achievements").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("journal_entries")
      .select("id, title, entry_date, created_at, country, country_slug, city, city_slug")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .limit(500),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("journal_entries").select("id, country, country_slug, city, city_slug", { count: "exact" }).eq("is_private", false)
  ]);

  const visits = ((visitsResult.data ?? []) as VisitRow[]).map((visit) => ({ ...visit, venue: visit.venues ?? null }));
  const journals = (journalsResult.data ?? []) as JournalSummary[];

  const countries = new Map<string, AnalyticsBucket>();
  const cities = new Map<string, AnalyticsBucket>();
  const categories = new Map<string, AnalyticsBucket>();
  const visitMonths = new Map<string, AnalyticsBucket>();
  const journalMonths = new Map<string, AnalyticsBucket>();
  const publicDestinations = new Map<string, AnalyticsBucket>();

  visits.forEach((visit) => {
    increment(countries, visit.venue?.country_slug, visit.venue?.country, visit.venue?.country_slug);
    increment(cities, visit.venue?.city_slug, visit.venue?.city, visit.venue?.city_slug);
    increment(categories, visit.venue?.category, visit.venue?.category);
    const label = monthLabel(visit.visited_on);
    increment(visitMonths, label, label);
  });

  journals.forEach((entry) => {
    const label = monthLabel(entry.entry_date);
    increment(journalMonths, label, label);
  });

  ((publicJournalResult.data ?? []) as Array<Pick<Tables<"journal_entries">, "city" | "city_slug" | "country" | "country_slug">>).forEach((entry) => {
    const key = `${entry.country_slug ?? "unknown"}-${entry.city_slug ?? "unknown"}`;
    increment(publicDestinations, key, entry.city && entry.country ? `${entry.city}, ${entry.country}` : entry.country ?? "Public destination");
  });

  const countryList = sortedBuckets(countries);
  const cityList = sortedBuckets(cities);
  const recentActivity = [
    ...visits.slice(0, 8).map((visit) => ({ date: visit.visited_on, label: `Visited ${visit.venue?.name ?? "a venue"}`, type: "visit" as const })),
    ...journals.slice(0, 8).map((entry) => ({ date: entry.entry_date, label: `Wrote ${entry.title}`, type: "journal" as const }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return {
    achievements: achievementsResult.count ?? 0,
    activity: {
      journalsOverTime: sortedBuckets(journalMonths).reverse(),
      visitsOverTime: sortedBuckets(visitMonths).reverse()
    },
    community: {
      activeDestinations: sortedBuckets(publicDestinations).slice(0, 5),
      publicJournalCount: publicJournalResult.count ?? 0,
      travelerCount: travelerResult.count ?? 0
    },
    countries: countryList,
    cities: cityList,
    favorites: favoritesResult.count ?? 0,
    journalEntries: journals.length,
    mostVisitedCity: cityList[0] ?? null,
    mostVisitedCountry: countryList[0] ?? null,
    passportStamps: stampsResult.count ?? 0,
    recentActivity,
    topCategories: sortedBuckets(categories),
    travelStreak: travelStreak(visits),
    visits,
    venuesVisited: new Set(visits.map((visit) => visit.venue_id)).size
  };
}
