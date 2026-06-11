import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { VisitWithVenue } from "@/types/app";

type SupabaseAppClient = ReturnType<typeof createSupabaseBrowserClient>;

export async function listMyVisits(supabase: SupabaseAppClient): Promise<VisitWithVenue[]> {
  const { data, error } = await supabase
    .from("visits")
    .select("*, venues(name, city, country, category)")
    .order("visited_on", { ascending: false });

  if (error) {
    throw error;
  }

  return data as VisitWithVenue[];
}
