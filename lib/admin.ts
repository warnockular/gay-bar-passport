import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminRole = "user" | "moderator" | "admin";

export async function getCurrentAdminProfile() {
  const user = await requireUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile = data as Tables<"profiles"> | null;

  if (!profile || !["admin", "moderator"].includes(profile.role)) return null;
  return profile;
}

export async function requireAdminProfile(roles: AdminRole[] = ["admin", "moderator"]) {
  const profile = await getCurrentAdminProfile();
  if (!profile || !roles.includes(profile.role)) notFound();
  return profile;
}
