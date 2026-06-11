import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminSummary = {
  comments: number;
  favorites: number;
  follows: number;
  journalEntries: number;
  moderationQueue: number;
  passportStamps: number;
  publicJournals: number;
  publicProfiles: number;
  recentActivity: Array<{ date: string; label: string }>;
  totalUsers: number;
  venues: number;
  visits: number;
};

export type AdminProfile = Tables<"profiles">;
export type AdminVenue = Tables<"venues">;
export type AdminJournal = Tables<"journal_entries"> & { profiles?: Pick<Tables<"profiles">, "display_name"> | null };
export type AdminComment = Tables<"journal_comments"> & {
  journal_entries?: Pick<Tables<"journal_entries">, "title"> | null;
  profiles?: Pick<Tables<"profiles">, "display_name"> | null;
};

async function count(table: keyof Pick<TablesMap, "favorites" | "follows" | "journal_comments" | "journal_entries" | "moderation_flags" | "passport_stamps" | "profiles" | "venues" | "visits">, filter?: (query: any) => any) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: total } = await query;
  return total ?? 0;
}

type TablesMap = {
  favorites: Tables<"favorites">;
  follows: Tables<"follows">;
  journal_comments: Tables<"journal_comments">;
  journal_entries: Tables<"journal_entries">;
  moderation_flags: Tables<"moderation_flags">;
  passport_stamps: Tables<"passport_stamps">;
  profiles: Tables<"profiles">;
  venues: Tables<"venues">;
  visits: Tables<"visits">;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const supabase = await createSupabaseServerClient();
  const [totalUsers, publicProfiles, venues, favorites, visits, passportStamps, journalEntries, publicJournals, comments, follows, moderationQueue, users, journals] = await Promise.all([
    count("profiles"),
    count("profiles", (query) => query.is("deleted_at", null)),
    count("venues"),
    count("favorites"),
    count("visits"),
    count("passport_stamps"),
    count("journal_entries"),
    count("journal_entries", (query) => query.eq("is_private", false)),
    count("journal_comments"),
    count("follows"),
    count("moderation_flags", (query) => query.eq("status", "open")),
    supabase.from("profiles").select("display_name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("journal_entries").select("title, created_at").order("created_at", { ascending: false }).limit(5)
  ]);

  const recentActivity = [
    ...((users.data ?? []) as Pick<Tables<"profiles">, "created_at" | "display_name">[]).map((user) => ({ date: user.created_at, label: `New user: ${user.display_name ?? "Passport traveler"}` })),
    ...((journals.data ?? []) as Pick<Tables<"journal_entries">, "created_at" | "title">[]).map((journal) => ({ date: journal.created_at, label: `Journal entry: ${journal.title}` }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return { comments, favorites, follows, journalEntries, moderationQueue, passportStamps, publicJournals, publicProfiles, recentActivity, totalUsers, venues, visits };
}

export async function listAdminUsers() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as AdminProfile[];
}

export async function getAdminUser(userId: string) {
  const users = await listAdminUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function listAdminVenues() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("venues").select("*").order("name").limit(100);
  return (data ?? []) as AdminVenue[];
}

export async function getAdminVenue(venueId: string) {
  const venues = await listAdminVenues();
  return venues.find((venue) => venue.id === venueId) ?? null;
}

export async function listAdminJournals() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("journal_entries").select("*, profiles(display_name)").eq("is_private", false).order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as AdminJournal[];
}

export async function listAdminComments() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("journal_comments").select("*, profiles(display_name), journal_entries(title)").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as AdminComment[];
}

export async function listModerationFlags() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("moderation_flags").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Tables<"moderation_flags">[];
}

export async function listAuditLogs() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Tables<"audit_logs">[];
}

export async function listAdminNotifications() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Tables<"notifications">[];
}
