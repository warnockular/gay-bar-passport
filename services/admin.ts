import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type AdminSummary = {
  comments: number;
  favorites: number;
  follows: number;
  importReadiness: {
    approvedImports: number;
    duplicateCandidates: number;
    pendingImports: number;
    stagedVenues: number;
  };
  journalEntries: number;
  moderationQueue: number;
  passportStamps: number;
  publicJournals: number;
  publicProfiles: number;
  recentActivity: Array<{ date: string; label: string }>;
  totalUsers: number;
  venueQuality: {
    averageCompleteness: number;
    featuredReady: number;
    incomplete: number;
    publishReady: number;
  };
  venueModeration: {
    imported: number;
    pendingReview: number;
    unverified: number;
    verified: number;
  };
  venues: number;
  visits: number;
};

export type AdminProfile = Tables<"profiles">;
export type AdminVenue = Tables<"venues">;
export type AdminImportBatch = Tables<"import_batches">;
export type AdminBulkOperationDraft = Tables<"venue_bulk_operation_drafts">;
export type AdminStagedVenue = Tables<"venue_import_staging"> & {
  duplicateVenue?: Pick<Tables<"venues">, "id" | "name" | "city" | "country"> | null;
};
export type AdminJournal = Tables<"journal_entries"> & { profiles?: Pick<Tables<"profiles">, "display_name"> | null };
export type AdminComment = Tables<"journal_comments"> & {
  journal_entries?: Pick<Tables<"journal_entries">, "title"> | null;
  profiles?: Pick<Tables<"profiles">, "display_name"> | null;
};

async function count(table: keyof Pick<TablesMap, "favorites" | "follows" | "import_batches" | "journal_comments" | "journal_entries" | "moderation_flags" | "passport_stamps" | "profiles" | "venues" | "venue_bulk_operation_drafts" | "venue_import_staging" | "visits">, filter?: (query: any) => any) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: total } = await query;
  return total ?? 0;
}

type TablesMap = {
  favorites: Tables<"favorites">;
  follows: Tables<"follows">;
  import_batches: Tables<"import_batches">;
  journal_comments: Tables<"journal_comments">;
  journal_entries: Tables<"journal_entries">;
  moderation_flags: Tables<"moderation_flags">;
  passport_stamps: Tables<"passport_stamps">;
  profiles: Tables<"profiles">;
  venues: Tables<"venues">;
  venue_bulk_operation_drafts: Tables<"venue_bulk_operation_drafts">;
  venue_import_staging: Tables<"venue_import_staging">;
  visits: Tables<"visits">;
};

export async function getAdminSummary(): Promise<AdminSummary> {
  const supabase = await createSupabaseServerClient();
  const [
    totalUsers,
    publicProfiles,
    venues,
    favorites,
    visits,
    passportStamps,
    journalEntries,
    publicJournals,
    comments,
    follows,
    moderationQueue,
    venueUnverified,
    venuePendingReview,
    venueVerified,
    venueImported,
    pendingImports,
    stagedVenues,
    duplicateCandidates,
    approvedImports,
    publishReadyVenues,
    incompleteVenues,
    featuredReadyVenues,
    completenessScores,
    users,
    journals
  ] = await Promise.all([
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
    count("venues", (query) => query.eq("verification_status", "unverified")),
    count("venues", (query) => query.eq("review_status", "pending_review")),
    count("venues", (query) => query.neq("verification_status", "unverified")),
    count("venues", (query) => query.eq("submission_status", "imported")),
    count("import_batches", (query) => query.in("status", ["pending", "processing"])),
    count("venue_import_staging"),
    count("venue_import_staging", (query) => query.eq("duplicate_review_status", "possible_duplicate")),
    count("venue_import_staging", (query) => query.eq("approval_status", "approved")),
    count("venues", (query) => query.eq("readiness_status", "publish_ready")),
    count("venues", (query) => query.eq("readiness_status", "incomplete")),
    count("venues", (query) => query.eq("readiness_status", "featured_ready")),
    supabase.from("venues").select("completeness_score").limit(1000),
    supabase.from("profiles").select("display_name, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("journal_entries").select("title, created_at").order("created_at", { ascending: false }).limit(5)
  ]);

  const recentActivity = [
    ...((users.data ?? []) as Pick<Tables<"profiles">, "created_at" | "display_name">[]).map((user) => ({ date: user.created_at, label: `New user: ${user.display_name ?? "Passport traveler"}` })),
    ...((journals.data ?? []) as Pick<Tables<"journal_entries">, "created_at" | "title">[]).map((journal) => ({ date: journal.created_at, label: `Journal entry: ${journal.title}` }))
  ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const scoreRows = (completenessScores.data ?? []) as Array<Pick<Tables<"venues">, "completeness_score">>;
  const averageCompleteness = scoreRows.length ? Math.round(scoreRows.reduce((total, venue) => total + venue.completeness_score, 0) / scoreRows.length) : 0;

  return {
    comments,
    favorites,
    follows,
    importReadiness: {
      approvedImports,
      duplicateCandidates,
      pendingImports,
      stagedVenues
    },
    journalEntries,
    moderationQueue,
    passportStamps,
    publicJournals,
    publicProfiles,
    recentActivity,
    totalUsers,
    venueQuality: {
      averageCompleteness,
      featuredReady: featuredReadyVenues,
      incomplete: incompleteVenues,
      publishReady: publishReadyVenues
    },
    venueModeration: {
      imported: venueImported,
      pendingReview: venuePendingReview,
      unverified: venueUnverified,
      verified: venueVerified
    },
    venues,
    visits
  };
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

export type VenueQueueFilter = "all" | "claimed_review" | "community_submitted" | "imported_review" | "owner_submitted" | "unverified";
export type VenueQueueSort = "name" | "newest" | "score";

export async function listAdminVenueReviewQueue(filter: VenueQueueFilter = "unverified", sort: VenueQueueSort = "newest") {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("venues").select("*");

  if (filter === "unverified") query = query.eq("verification_status", "unverified");
  if (filter === "community_submitted") query = query.eq("submission_status", "community_submitted");
  if (filter === "owner_submitted") query = query.eq("submission_status", "owner_submitted");
  if (filter === "imported_review") query = query.eq("submission_status", "imported").eq("review_status", "pending_review");
  if (filter === "claimed_review") query = query.not("claimed_by", "is", null).is("reviewed_at", null);

  if (sort === "name") query = query.order("name", { ascending: true });
  if (sort === "score") query = query.order("verification_score", { ascending: true }).order("name", { ascending: true });
  if (sort === "newest") query = query.order("created_at", { ascending: false });

  const { data } = await query.limit(100);
  return (data ?? []) as AdminVenue[];
}

export async function getAdminVenue(venueId: string) {
  const venues = await listAdminVenues();
  return venues.find((venue) => venue.id === venueId) ?? null;
}

export async function listImportBatches() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("import_batches").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as AdminImportBatch[];
}

export async function getImportBatch(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("import_batches").select("*").eq("id", batchId).maybeSingle();
  return data as AdminImportBatch | null;
}

export async function listStagedVenues(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venue_import_staging")
    .select("*, venues(id, name, city, country)")
    .eq("import_batch_id", batchId)
    .order("created_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as Array<Tables<"venue_import_staging"> & { venues?: AdminStagedVenue["duplicateVenue"] }>).map((row) => ({
    ...row,
    duplicateVenue: row.venues ?? null
  }));
}

export async function getImportBatchStats(batchId: string) {
  const [total, pending, approved, rejected, merged, duplicateCandidates] = await Promise.all([
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId)),
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId).eq("approval_status", "pending")),
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId).eq("approval_status", "approved")),
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId).eq("approval_status", "rejected")),
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId).eq("approval_status", "merged")),
    count("venue_import_staging", (query) => query.eq("import_batch_id", batchId).eq("duplicate_review_status", "possible_duplicate"))
  ]);

  return { approved, duplicateCandidates, merged, pending, rejected, total };
}

export async function listBulkOperationDrafts() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("venue_bulk_operation_drafts").select("*").order("created_at", { ascending: false }).limit(20);
  return (data ?? []) as AdminBulkOperationDraft[];
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
