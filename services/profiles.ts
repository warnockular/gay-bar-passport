import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

// Profile reads belong in services/ so dashboard, profile, and future onboarding can share one access path.
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function ensureProfile(userId: string, fallbackName?: string | null): Promise<Profile> {
  const existingProfile = await getProfile(userId);

  if (existingProfile) {
    return existingProfile;
  }

  const supabase = await createSupabaseServerClient();
  const displayName = fallbackName ?? "Passport traveler";
  const profileInsert: ProfileInsert = { id: userId, display_name: displayName };

  const { data, error } = await supabase
    .from("profiles")
    .insert(profileInsert as never)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
