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
    pendingClaims: number;
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
export type AdminVenueTag = Pick<Tables<"tags">, "id" | "name" | "slug">;
export type AdminImportBatch = Tables<"import_batches">;
export type AdminBulkOperationDraft = Tables<"venue_bulk_operation_drafts">;
export type AdminStagedVenue = Tables<"venue_import_staging"> & {
  approvedVenue?: Pick<Tables<"venues">, "id" | "name" | "city" | "country" | "slug"> | null;
  duplicateVenue?: Pick<Tables<"venues">, "id" | "name" | "city" | "country"> | null;
  importBatch?: Pick<Tables<"import_batches">, "id" | "source_name" | "source_type" | "created_at"> | null;
  matchedVenue?: Pick<Tables<"venues">, "id" | "name" | "city" | "country" | "slug"> | null;
};
export type AdminDuplicateCandidate = AdminStagedVenue & {
  importBatch?: Pick<Tables<"import_batches">, "id" | "source_name" | "source_type"> | null;
};
type DuplicateVenueSummary = Pick<Tables<"venues">, "address" | "archived_at" | "city" | "country" | "id" | "latitude" | "longitude" | "name" | "website_url">;
type ImportMatchVenue = Pick<Tables<"venues">, "address" | "city" | "country" | "id" | "image_url" | "latitude" | "longitude" | "name" | "opening_hours" | "phone" | "postal_code" | "slug" | "website_url">;
export type ImportCandidateMatch = {
  confidenceLabel: "High confidence duplicate" | "Possible duplicate" | "Unique";
  confidenceScore: number;
  differences: Array<{ currentValue: string; field: string; importedValue: string }>;
  reasons: string[];
  venue: ImportMatchVenue;
};
export type AdminStoredDuplicateCandidate = Tables<"venue_duplicate_candidates"> & {
  venueA?: DuplicateVenueSummary | null;
  venueB?: DuplicateVenueSummary | null;
};
export type DuplicateCandidateFilters = {
  city?: string;
  confidenceLevel?: "all" | "high" | "medium" | "low";
  country?: string;
  sort?: "highest" | "lowest" | "newest" | "oldest";
};
export type DuplicateCandidateFilterOptions = {
  cities: string[];
  countries: string[];
};
export type VenueMergePreview = {
  favorites: number;
  favoriteConflicts: number;
  journals: number;
  passportStamps: number;
  sourceVenue: AdminVenue;
  targetVenue: AdminVenue;
  tags: number;
  visitConflicts: number;
  visits: number;
};
export type AdminVenueClaim = Tables<"venue_claims"> & {
  claimant?: Pick<Tables<"profiles">, "display_name" | "id"> | null;
  reviewer?: Pick<Tables<"profiles">, "display_name" | "id"> | null;
  venue?: Pick<Tables<"venues">, "city" | "country" | "id" | "name" | "slug" | "verification_status"> | null;
};
export type AdminJournal = Tables<"journal_entries"> & { profiles?: Pick<Tables<"profiles">, "display_name"> | null };
export type AdminComment = Tables<"journal_comments"> & {
  journal_entries?: Pick<Tables<"journal_entries">, "title"> | null;
  profiles?: Pick<Tables<"profiles">, "display_name"> | null;
};
export type AuditLogFilters = {
  action?: string;
  order?: "newest" | "oldest";
  targetType?: string;
};
export type AdminAuditLog = Tables<"audit_logs"> & {
  actor?: Pick<Tables<"profiles">, "display_name" | "id"> | null;
  duplicateCandidate?: (Pick<Tables<"venue_duplicate_candidates">, "id" | "match_reasons" | "venue_a_id" | "venue_b_id"> & {
    venueA?: Pick<Tables<"venues">, "city" | "country" | "id" | "name"> | null;
    venueB?: Pick<Tables<"venues">, "city" | "country" | "id" | "name"> | null;
  }) | null;
  venue?: Pick<Tables<"venues">, "city" | "country" | "id" | "name"> | null;
  venueRefs: Record<string, Pick<Tables<"venues">, "city" | "country" | "id" | "name">>;
};

async function count(table: keyof Pick<TablesMap, "favorites" | "follows" | "import_batches" | "journal_comments" | "journal_entries" | "moderation_flags" | "passport_stamps" | "profiles" | "venues" | "venue_claims" | "venue_bulk_operation_drafts" | "venue_duplicate_candidates" | "venue_import_staging" | "visits">, filter?: (query: any) => any) {
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
  venue_claims: Tables<"venue_claims">;
  venue_duplicate_candidates: Tables<"venue_duplicate_candidates">;
  venue_merge_records: Tables<"venue_merge_records">;
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
    venuePendingClaims,
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
    count("venue_claims", (query) => query.eq("status", "pending")),
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
      pendingClaims: venuePendingClaims,
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
  const { data } = await supabase.from("venues").select("*").order("created_at", { ascending: false }).limit(500);
  return (data ?? []) as AdminVenue[];
}

export type VenueQueueFilter = "active" | "all" | "archived" | "claimed_review" | "community_submitted" | "imported_review" | "needs_review" | "owner_submitted" | "pending_review" | "rejected" | "unverified";
export type VenueQueueSort = "name" | "newest" | "score";

export async function listAdminVenueReviewQueue(filter: VenueQueueFilter = "unverified", sort: VenueQueueSort = "newest") {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("venues").select("*");
  let pendingClaimVenueIds: string[] = [];

  if (filter === "claimed_review") {
    const { data: claims } = await supabase.from("venue_claims").select("venue_id").eq("status", "pending").limit(100);
    pendingClaimVenueIds = Array.from(new Set(((claims ?? []) as Array<Pick<Tables<"venue_claims">, "venue_id">>).map((claim) => claim.venue_id)));
    if (!pendingClaimVenueIds.length) return [];
  }

  if (filter === "pending_review") query = query.eq("review_status", "pending_review").is("archived_at", null);
  if (filter === "active") query = query.eq("review_status", "active").is("archived_at", null);
  if (filter === "needs_review") query = query.in("review_status", ["needs_review", "hidden"]).is("archived_at", null);
  if (filter === "archived") query = query.not("archived_at", "is", null);
  if (filter === "rejected") query = query.eq("review_status", "rejected").is("archived_at", null);
  if (filter === "unverified") query = query.eq("verification_status", "unverified").is("archived_at", null);
  if (filter === "community_submitted") query = query.eq("submission_status", "community_submitted").eq("review_status", "pending_review").eq("source", "community_submission");
  if (filter === "owner_submitted") query = query.eq("submission_status", "owner_submitted");
  if (filter === "imported_review") query = query.eq("submission_status", "imported").eq("review_status", "pending_review");
  if (filter === "claimed_review") query = query.in("id", pendingClaimVenueIds);

  if (sort === "name") query = query.order("name", { ascending: true });
  if (sort === "score") query = query.order("verification_score", { ascending: true }).order("name", { ascending: true });
  if (sort === "newest") query = query.order("created_at", { ascending: false });

  const { data } = await query.limit(100);
  return (data ?? []) as AdminVenue[];
}

export async function listVenueClaims(status: Tables<"venue_claims">["status"] | "all" = "pending") {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("venue_claims")
    .select("*, venues(id, name, slug, city, country, verification_status), claimant:profiles!venue_claims_claimant_id_fkey(id, display_name), reviewer:profiles!venue_claims_reviewed_by_fkey(id, display_name)")
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

  const { data } = await query.limit(100);
  return ((data ?? []) as Array<Tables<"venue_claims"> & {
    claimant?: AdminVenueClaim["claimant"];
    reviewer?: AdminVenueClaim["reviewer"];
    venues?: AdminVenueClaim["venue"];
  }>).map((claim) => ({
    ...claim,
    venue: claim.venues ?? null
  }));
}

export async function listVenueClaimsForVenue(venueId: string) {
  const claims = await listVenueClaims("all");
  return claims.filter((claim) => claim.venue_id === venueId);
}

export async function getAdminVenue(venueId: string) {
  const venues = await listAdminVenues();
  return venues.find((venue) => venue.id === venueId) ?? null;
}

export async function listAdminVenueTags(venueId: string): Promise<AdminVenueTag[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venue_tags")
    .select("tags(id, name, slug)")
    .eq("venue_id", venueId);

  return ((data ?? []) as Array<{ tags?: AdminVenueTag | null }>)
    .map((row) => row.tags)
    .filter((tag): tag is AdminVenueTag => Boolean(tag))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export async function listDuplicateCandidates() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venue_import_staging")
    .select("*, duplicateVenue:venues!venue_import_staging_duplicate_existing_venue_id_fkey(id, name, city, country), import_batches(id, source_name, source_type)")
    .in("duplicate_review_status", ["possible_duplicate", "confirmed_duplicate"])
    .order("created_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as Array<Tables<"venue_import_staging"> & {
    duplicateVenue?: AdminStagedVenue["duplicateVenue"];
    import_batches?: AdminDuplicateCandidate["importBatch"];
  }>).map((row) => ({
    ...row,
    duplicateVenue: row.duplicateVenue ?? null,
    importBatch: row.import_batches ?? null
  }));
}

export async function listVenueDuplicateCandidates(filters: DuplicateCandidateFilters = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("venue_duplicate_candidates")
    .select(`
      *,
      venueA:venues!venue_duplicate_candidates_venue_a_id_fkey(id, name, city, country, address, website_url, latitude, longitude, archived_at),
      venueB:venues!venue_duplicate_candidates_venue_b_id_fkey(id, name, city, country, address, website_url, latitude, longitude, archived_at)
    `)
    .eq("status", "pending");

  if (filters.confidenceLevel && filters.confidenceLevel !== "all") {
    query = query.eq("confidence_level", filters.confidenceLevel);
  }

  if (filters.sort === "lowest") {
    query = query.order("confidence_score", { ascending: true }).order("created_at", { ascending: false });
  } else if (filters.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (filters.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("confidence_score", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data } = await query.limit(100);
  const cityFilter = filters.city?.trim().toLowerCase();
  const countryFilter = filters.country?.trim().toLowerCase();

  return ((data ?? []) as Array<Tables<"venue_duplicate_candidates"> & {
    venueA?: DuplicateVenueSummary | null;
    venueB?: DuplicateVenueSummary | null;
  }>).filter((candidate) => {
    const cities = [candidate.venueA?.city, candidate.venueB?.city].filter(Boolean).map((city) => city!.toLowerCase());
    const countries = [candidate.venueA?.country, candidate.venueB?.country].filter(Boolean).map((country) => country!.toLowerCase());
    return (!cityFilter || cities.includes(cityFilter)) && (!countryFilter || countries.includes(countryFilter));
  });
}

export async function listDuplicateCandidateFilterOptions(): Promise<DuplicateCandidateFilterOptions> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venues")
    .select("city, country")
    .is("archived_at", null)
    .order("country", { ascending: true })
    .order("city", { ascending: true })
    .limit(1000);

  const rows = (data ?? []) as Array<Pick<Tables<"venues">, "city" | "country">>;
  return {
    cities: Array.from(new Set(rows.map((venue) => venue.city).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    countries: Array.from(new Set(rows.map((venue) => venue.country).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  };
}

export async function getVenueMergePreview(sourceVenueId: string, targetVenueId: string): Promise<VenueMergePreview | null> {
  if (!sourceVenueId || !targetVenueId || sourceVenueId === targetVenueId) return null;
  const supabase = await createSupabaseServerClient();
  const [sourceVenue, targetVenue] = await Promise.all([getAdminVenue(sourceVenueId), getAdminVenue(targetVenueId)]);
  if (!sourceVenue || !targetVenue) return null;

  const [favorites, targetFavorites, visits, targetVisits, passportStamps, journals, tags] = await Promise.all([
    supabase.from("favorites").select("user_id").eq("venue_id", sourceVenueId).limit(1000),
    supabase.from("favorites").select("user_id").eq("venue_id", targetVenueId).limit(1000),
    supabase.from("visits").select("user_id, visited_on").eq("venue_id", sourceVenueId).limit(1000),
    supabase.from("visits").select("user_id, visited_on").eq("venue_id", targetVenueId).limit(1000),
    supabase.from("passport_stamps").select("id", { count: "exact", head: true }).eq("venue_id", sourceVenueId),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("venue_id", sourceVenueId),
    supabase.from("venue_tags").select("tag_id").eq("venue_id", sourceVenueId).limit(200)
  ]);

  const targetFavoriteUsers = new Set(((targetFavorites.data ?? []) as Array<{ user_id: string }>).map((favorite) => favorite.user_id));
  const favoriteConflicts = ((favorites.data ?? []) as Array<{ user_id: string }>).filter((favorite) => targetFavoriteUsers.has(favorite.user_id)).length;
  const targetVisitKeys = new Set(((targetVisits.data ?? []) as Array<{ user_id: string; visited_on: string }>).map((visit) => `${visit.user_id}:${visit.visited_on}`));
  const visitConflicts = ((visits.data ?? []) as Array<{ user_id: string; visited_on: string }>).filter((visit) => targetVisitKeys.has(`${visit.user_id}:${visit.visited_on}`)).length;

  return {
    favorites: favorites.data?.length ?? 0,
    favoriteConflicts,
    journals: journals.count ?? 0,
    passportStamps: passportStamps.count ?? 0,
    sourceVenue,
    targetVenue,
    tags: tags.data?.length ?? 0,
    visitConflicts,
    visits: visits.data?.length ?? 0
  };
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
    .select("*, duplicateVenue:venues!venue_import_staging_duplicate_existing_venue_id_fkey(id, name, city, country), approvedVenue:venues!venue_import_staging_approved_venue_id_fkey(id, name, city, country, slug)")
    .eq("import_batch_id", batchId)
    .order("created_at", { ascending: false })
    .limit(100);

  return ((data ?? []) as Array<Tables<"venue_import_staging"> & {
    approvedVenue?: AdminStagedVenue["approvedVenue"];
    duplicateVenue?: AdminStagedVenue["duplicateVenue"];
  }>).map((row) => ({
    ...row,
    approvedVenue: row.approvedVenue ?? null,
    duplicateVenue: row.duplicateVenue ?? null
  }));
}

export async function getStagedVenue(candidateId: string): Promise<AdminStagedVenue | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venue_import_staging")
    .select(`
      *,
      importBatch:import_batches(id, source_name, source_type, created_at),
      duplicateVenue:venues!venue_import_staging_duplicate_existing_venue_id_fkey(id, name, city, country),
      matchedVenue:venues!venue_import_staging_matched_venue_id_fkey(id, name, city, country, slug),
      approvedVenue:venues!venue_import_staging_approved_venue_id_fkey(id, name, city, country, slug)
    `)
    .eq("id", candidateId)
    .maybeSingle();

  return (data as AdminStagedVenue | null) ?? null;
}

function normalizeImportText(value: unknown) {
  return typeof value === "string"
    ? value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
    : "";
}

function normalizeImportAddress(value: unknown) {
  return normalizeImportText(value)
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\broad\b/g, "rd")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\brue\b/g, "rue")
    .replace(/\s+/g, " ")
    .trim();
}

function importDomain(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return normalizeImportText(value).replace(/^www /, "");
  }
}

function importTokenSimilarity(first: string, second: string) {
  if (!first || !second) return 0;
  if (first === second) return 1;
  if (first.includes(second) || second.includes(first)) return 0.86;
  const firstTokens = new Set(first.split(" ").filter(Boolean));
  const secondTokens = new Set(second.split(" ").filter(Boolean));
  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;
  return union ? overlap / union : 0;
}

function importDistanceKm(firstLat: number | null, firstLng: number | null, secondLat: number | null, secondLng: number | null) {
  if (firstLat === null || firstLng === null || secondLat === null || secondLng === null) return null;
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(secondLat - firstLat);
  const longitudeDelta = toRadians(secondLng - firstLng);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(firstLat)) * Math.cos(toRadians(secondLat)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function candidateValue(candidate: Tables<"venue_import_staging">, key: string) {
  const raw = objectValue(candidate.raw_data);
  const metadata = objectValue(candidate.source_metadata);
  const address = objectValue(candidate.address_components);
  const direct = candidate[key as keyof Tables<"venue_import_staging">];
  for (const value of [direct, raw[key], metadata[key], address[key]]) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function matchConfidenceLabel(score: number): ImportCandidateMatch["confidenceLabel"] {
  if (score >= 90) return "High confidence duplicate";
  if (score >= 70) return "Possible duplicate";
  return "Unique";
}

function diffValue(value: unknown) {
  if (typeof value === "number") return String(value);
  return typeof value === "string" && value.trim() ? value.trim() : "Not provided";
}

export async function listImportCandidateMatches(candidate: Tables<"venue_import_staging">): Promise<ImportCandidateMatch[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("venues")
    .select("id, name, slug, address, city, country, website_url, latitude, longitude, opening_hours, image_url, phone, postal_code")
    .is("archived_at", null)
    .limit(500);
  const venues = (data ?? []) as ImportMatchVenue[];
  const candidateName = candidateValue(candidate, "name");
  const candidateSlug = normalizeImportText(candidateName).replace(/\s+/g, "-");
  const candidateCity = normalizeImportText(candidateValue(candidate, "city"));
  const candidateWebsite = candidateValue(candidate, "website_url");
  const candidateWebsiteDomain = importDomain(candidateWebsite);
  const candidateAddress = candidateValue(candidate, "address");
  const normalizedCandidateAddress = normalizeImportAddress(candidateAddress);

  return venues.map((venue) => {
    const reasons: string[] = [];
    let score = 0;
    const venueName = normalizeImportText(venue.name);
    const nameSimilarity = importTokenSimilarity(normalizeImportText(candidateName), venueName);
    const sameCity = candidateCity && candidateCity === normalizeImportText(venue.city);

    if (candidateName && venueName && normalizeImportText(candidateName) === venueName) {
      score += 30;
      reasons.push("Exact name");
    } else if (nameSimilarity >= 0.75) {
      score += 22;
      reasons.push("Similar name");
    }

    if (candidateSlug && venue.slug.includes(candidateSlug)) {
      score += 15;
      reasons.push("Slug similarity");
    }
    if (sameCity) {
      score += 10;
      reasons.push("Same city");
    }
    if (candidateWebsiteDomain && candidateWebsiteDomain === importDomain(venue.website_url)) {
      score += 30;
      reasons.push("Same website");
    }
    const distance = importDistanceKm(candidate.latitude, candidate.longitude, venue.latitude, venue.longitude);
    if (distance !== null && distance <= 0.25) {
      score += distance <= 0.1 ? 20 : 15;
      reasons.push("Nearby coordinates");
    }
    if (normalizedCandidateAddress && normalizedCandidateAddress === normalizeImportAddress(venue.address)) {
      score += 25;
      reasons.push("Similar address");
    }

    const confidenceScore = Math.min(score, 100);
    const differences = [
      { currentValue: diffValue(venue.name), field: "Name", importedValue: diffValue(candidateName) },
      { currentValue: diffValue(venue.website_url), field: "Website", importedValue: diffValue(candidateWebsite) },
      { currentValue: diffValue(venue.address), field: "Address", importedValue: diffValue(candidateAddress) },
      { currentValue: venue.latitude !== null && venue.longitude !== null ? `${venue.latitude}, ${venue.longitude}` : "Not provided", field: "Coordinates", importedValue: candidate.latitude !== null && candidate.longitude !== null ? `${candidate.latitude}, ${candidate.longitude}` : "Not provided" },
      { currentValue: diffValue(venue.opening_hours), field: "Opening hours", importedValue: diffValue(candidateValue(candidate, "opening_hours")) },
      { currentValue: diffValue(venue.image_url), field: "Image URL", importedValue: diffValue(candidateValue(candidate, "image_url")) },
      { currentValue: diffValue(venue.phone), field: "Phone", importedValue: diffValue(candidate.phone) }
    ];

    return {
      confidenceLabel: matchConfidenceLabel(confidenceScore),
      confidenceScore,
      differences,
      reasons,
      venue
    };
  })
    .filter((match) => match.confidenceScore > 0)
    .sort((first, second) => second.confidenceScore - first.confidenceScore)
    .slice(0, 8);
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

export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("audit_logs").select("*");

  if (filters.action) query = query.eq("action", filters.action);
  if (filters.targetType) query = query.eq("target_type", filters.targetType);

  const { data } = await query.order("created_at", { ascending: filters.order === "oldest" }).limit(100);
  const logs = (data ?? []) as Tables<"audit_logs">[];
  const actorIds = Array.from(new Set(logs.map((log) => log.actor_id).filter(Boolean))) as string[];
  const metadataVenueKeys = ["existingVenueId", "sourceVenueId", "targetVenueId", "venueId"];
  const metadataVenueIds = logs.flatMap((log) => {
    if (!log.metadata || typeof log.metadata !== "object" || Array.isArray(log.metadata)) return [];
    const metadata = log.metadata as Record<string, unknown>;
    return metadataVenueKeys.map((key) => metadata[key]).filter((value): value is string => typeof value === "string");
  });
  const venueIds = Array.from(new Set([
    ...logs.filter((log) => log.target_type === "venue").map((log) => log.target_id).filter(Boolean),
    ...metadataVenueIds
  ])) as string[];
  const duplicateCandidateIds = Array.from(new Set(logs
    .filter((log) => log.target_type === "venue_duplicate_candidate" && log.target_id)
    .map((log) => log.target_id))) as string[];

  const [profilesResult, venuesResult, duplicateCandidatesResult] = await Promise.all([
    actorIds.length ? supabase.from("profiles").select("id, display_name").in("id", actorIds) : Promise.resolve({ data: [] }),
    venueIds.length ? supabase.from("venues").select("id, name, city, country").in("id", venueIds) : Promise.resolve({ data: [] }),
    duplicateCandidateIds.length
      ? supabase
        .from("venue_duplicate_candidates")
        .select("id, match_reasons, venue_a_id, venue_b_id, venueA:venues!venue_duplicate_candidates_venue_a_id_fkey(id, name, city, country), venueB:venues!venue_duplicate_candidates_venue_b_id_fkey(id, name, city, country)")
        .in("id", duplicateCandidateIds)
      : Promise.resolve({ data: [] })
  ]);

  const profilesById = new Map(((profilesResult.data ?? []) as Pick<Tables<"profiles">, "display_name" | "id">[]).map((profile) => [profile.id, profile]));
  const venuesById = new Map(((venuesResult.data ?? []) as Pick<Tables<"venues">, "city" | "country" | "id" | "name">[]).map((venue) => [venue.id, venue]));
  const duplicateCandidatesById = new Map(((duplicateCandidatesResult.data ?? []) as Array<Pick<Tables<"venue_duplicate_candidates">, "id" | "match_reasons" | "venue_a_id" | "venue_b_id"> & {
    venueA?: Pick<Tables<"venues">, "city" | "country" | "id" | "name"> | null;
    venueB?: Pick<Tables<"venues">, "city" | "country" | "id" | "name"> | null;
  }>).map((candidate) => [candidate.id, candidate]));

  return logs.map((log) => ({
    ...log,
    actor: log.actor_id ? profilesById.get(log.actor_id) ?? null : null,
    duplicateCandidate: log.target_type === "venue_duplicate_candidate" && log.target_id ? duplicateCandidatesById.get(log.target_id) ?? null : null,
    venue: log.target_type === "venue" && log.target_id ? venuesById.get(log.target_id) ?? null : null,
    venueRefs: Object.fromEntries([...venuesById.entries()])
  })) satisfies AdminAuditLog[];
}

export async function listAdminNotifications() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Tables<"notifications">[];
}
