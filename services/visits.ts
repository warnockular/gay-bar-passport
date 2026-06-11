import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type VisitPhoto = Tables<"visit_photos"> & {
  signedUrl: string | null;
};

export type Achievement = Tables<"achievements"> & {
  awarded_at: string;
};

export type PassportVisit = Tables<"visits"> & {
  photos: VisitPhoto[];
  stamp: Tables<"passport_stamps"> | null;
  venue: Pick<Tables<"venues">, "category" | "city" | "city_slug" | "country" | "country_slug" | "id" | "image_url" | "name" | "slug"> | null;
};

type VisitRow = Tables<"visits"> & {
  passport_stamps?: Tables<"passport_stamps">[] | null;
  venues?: PassportVisit["venue"];
  visit_photos?: Tables<"visit_photos">[] | null;
};

async function signVisitPhotos(photos: Tables<"visit_photos">[]) {
  if (!photos.length) return [];

  const supabase = await createSupabaseServerClient();
  return Promise.all(
    photos.map(async (photo) => {
      const { data } = await supabase.storage.from("visit-photos").createSignedUrl(photo.storage_path, 60 * 10);
      return { ...photo, signedUrl: data?.signedUrl ?? null };
    })
  );
}

export async function listPassportVisits(userId: string): Promise<PassportVisit[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("visits")
    .select("*, venues(id, name, slug, city, city_slug, country, country_slug, category, image_url), visit_photos(*), passport_stamps(*)")
    .eq("user_id", userId)
    .order("visited_on", { ascending: false });

  if (error) return [];

  return Promise.all(
    ((data ?? []) as VisitRow[]).map(async (visit) => ({
      ...visit,
      photos: await signVisitPhotos(visit.visit_photos ?? []),
      stamp: visit.passport_stamps?.[0] ?? null,
      venue: visit.venues ?? null
    }))
  );
}

export async function getVisitForEdit(userId: string, visitId: string): Promise<PassportVisit | null> {
  const visits = await listPassportVisits(userId);
  return visits.find((visit) => visit.id === visitId) ?? null;
}

export async function listUserAchievements(userId: string): Promise<Achievement[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("user_achievements")
    .select("awarded_at, achievements(*)")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });

  if (error) return [];

  return ((data ?? []) as Array<{ awarded_at: string; achievements?: Tables<"achievements"> | null }>)
    .map((row) => {
      const achievement = row.achievements;
      return achievement ? { ...achievement, awarded_at: row.awarded_at } : null;
    })
    .filter((achievement): achievement is Achievement => Boolean(achievement));
}

export async function awardVisitAchievements(userId: string) {
  if (!isSupabaseConfigured) return;

  const supabase = await createSupabaseServerClient();
  const [{ data: visits }, { count: favoriteCount }, { data: profileData }] = await Promise.all([
    supabase.from("visits").select("venue_id, venues(city_slug, country)").eq("user_id", userId),
    supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("profiles").select("home_city").eq("id", userId).maybeSingle()
  ]);

  const visitRows = (visits ?? []) as Array<{ venue_id: string; venues: { city_slug: string; country: string } | null }>;
  const profile = profileData as Pick<Tables<"profiles">, "home_city"> | null;
  const countries = new Set(visitRows.map((visit) => visit.venues?.country).filter(Boolean));
  const uniqueVenues = new Set(visitRows.map((visit) => visit.venue_id));
  const homeCity = profile?.home_city?.toLowerCase() ?? "";
  const hasInternationalVisit = countries.size > 1 || visitRows.some((visit) => visit.venues?.country && homeCity && !homeCity.includes(visit.venues.country.toLowerCase()));

  const earnedCodes = [
    visitRows.length > 0 ? "first_visit" : null,
    (favoriteCount ?? 0) > 0 ? "first_favorite" : null,
    uniqueVenues.size >= 5 ? "five_venues_visited" : null,
    hasInternationalVisit ? "first_international_visit" : null,
    visitRows.some((visit) => visit.venues?.city_slug === "lisbon") ? "lisbon_explorer" : null
  ].filter((code): code is string => Boolean(code));

  if (!earnedCodes.length) return;

  const { data: achievements } = await supabase.from("achievements").select("id, code").in("code", earnedCodes);
  const rows = ((achievements ?? []) as Array<Pick<Tables<"achievements">, "id" | "code">>).map((achievement) => ({ achievement_id: achievement.id, user_id: userId }));

  if (rows.length) {
    await supabase.from("user_achievements").upsert(rows as never, { onConflict: "user_id,achievement_id" });
  }
}
