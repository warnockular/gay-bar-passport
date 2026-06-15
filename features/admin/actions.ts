"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminProfile } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/database";

type ProfileRole = Tables<"profiles">["role"];
type ProfileStatus = Tables<"profiles">["status"];
type VenueStatus = Tables<"venues">["review_status"];
type VenueVerificationStatus = Tables<"venues">["verification_status"];
type VenueIdentityClassification = Tables<"venues">["identity_classification"];
type VenueSubmissionStatus = Tables<"venues">["submission_status"];
type ModerationStatus = Tables<"journal_entries">["moderation_status"];
type ImportApprovalStatus = Tables<"venue_import_staging">["approval_status"];
type VenueBulkOperationType = Tables<"venue_bulk_operation_drafts">["operation_type"];
type VenueClaimStatus = Tables<"venue_claims">["status"];
type VenueDuplicateCandidateLevel = Tables<"venue_duplicate_candidates">["confidence_level"];

const verificationScores: Record<VenueVerificationStatus, number> = {
  admin_verified: 100,
  community_verified: 80,
  owner_verified: 90,
  unverified: 0
};

async function logAudit(actorId: string, action: string, targetType: string, targetId: string | null, metadata: Record<string, string | boolean | null> = {}) {
  const supabase = await createSupabaseServerClient();
  await supabase.from("audit_logs").insert({ action, actor_id: actorId, metadata, target_id: targetId, target_type: targetType } as never);
}

function redirectWithFeedback(path?: string, key?: string) {
  if (path && path.startsWith("/")) {
    redirect(`${path}${path.includes("?") ? "&" : "?"}updated=${key ?? "saved"}`);
  }
}

function redirectWithError(path?: string, message = "save-failed") {
  if (path && path.startsWith("/")) {
    redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(message)}`);
  }
}

async function refreshImportBatchCounts(batchId: string) {
  const supabase = await createSupabaseServerClient();
  const [imported, approved, rejected] = await Promise.all([
    supabase.from("venue_import_staging").select("id", { count: "exact", head: true }).eq("import_batch_id", batchId),
    supabase.from("venue_import_staging").select("id", { count: "exact", head: true }).eq("import_batch_id", batchId).eq("approval_status", "approved"),
    supabase.from("venue_import_staging").select("id", { count: "exact", head: true }).eq("import_batch_id", batchId).eq("approval_status", "rejected")
  ]);

  await supabase
    .from("import_batches")
    .update({
      approved_count: approved.count ?? 0,
      imported_count: imported.count ?? 0,
      rejected_count: rejected.count ?? 0
    } as never)
    .eq("id", batchId);
}

export async function updateUserRole(userId: string, formData: FormData) {
  const admin = await requireAdminProfile(["admin"]);
  const role = String(formData.get("role") ?? "user") as ProfileRole;
  if (!["user", "moderator", "admin"].includes(role)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ role } as never).eq("id", userId);
  await logAudit(admin.id, "role_change", "user", userId, { role });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateUserStatus(userId: string, status: ProfileStatus) {
  const admin = await requireAdminProfile(["admin"]);
  if (!["active", "suspended"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ status } as never).eq("id", userId);
  await logAudit(admin.id, status === "suspended" ? "user_suspended" : "user_reinstated", "user", userId, { status });
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function softDeleteUser(userId: string) {
  const admin = await requireAdminProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  await supabase.from("profiles").update({ deleted_at: new Date().toISOString(), status: "suspended" } as never).eq("id", userId);
  await logAudit(admin.id, "user_soft_deleted", "user", userId);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateVenueStatus(venueId: string, status: VenueStatus, feedbackPath?: string) {
  const admin = await requireAdminProfile();
  if (!["active", "hidden", "pending_review"].includes(status)) {
    redirectWithError(feedbackPath, "Invalid review status.");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("venues").update({ is_published: status === "active", review_status: status } as never).eq("id", venueId);
  if (error) {
    redirectWithError(feedbackPath, error.message);
    return;
  }
  await logAudit(admin.id, "venue_status_changed", "venue", venueId, { status });
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueId}`);
  redirectWithFeedback(feedbackPath, "review-status");
}

export async function updateVenueMetadata(venueId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const category = String(formData.get("category") ?? "bar") as Database["public"]["Enums"]["venue_category"];
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim();
  const longitude = String(formData.get("longitude") ?? "").trim();
  const parsedLatitude = latitude ? Number(latitude) : null;
  const parsedLongitude = longitude ? Number(longitude) : null;
  if ((parsedLatitude !== null && Number.isNaN(parsedLatitude)) || (parsedLongitude !== null && Number.isNaN(parsedLongitude))) {
    redirectWithError(String(formData.get("feedbackPath") ?? ""), "Coordinates must be valid numbers.");
    return;
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("venues")
    .update({
      address: String(formData.get("address") ?? ""),
      category,
      city: String(formData.get("city") ?? ""),
      country: String(formData.get("country") ?? ""),
      description: String(formData.get("description") ?? ""),
      image_url: imageUrl || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      opening_hours: String(formData.get("openingHours") ?? ""),
      name: String(formData.get("name") ?? ""),
      neighborhood: String(formData.get("neighborhood") ?? ""),
      website_url: String(formData.get("websiteUrl") ?? "")
    } as never)
    .eq("id", venueId);
  if (error) {
    redirectWithError(String(formData.get("feedbackPath") ?? ""), error.message);
    return;
  }
  await logAudit(admin.id, "venue_metadata_updated", "venue", venueId);
  await logAudit(admin.id, "venue_quality_recalculated", "venue", venueId);
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
  const publicPath = String(formData.get("publicPath") ?? "");
  if (publicPath.startsWith("/venues/")) revalidatePath(publicPath);
  redirectWithFeedback(String(formData.get("feedbackPath") ?? ""), "metadata");
}

export async function updateVenueVerification(venueId: string, status: VenueVerificationStatus, feedbackPath?: string) {
  const admin = await requireAdminProfile();
  if (!["unverified", "community_verified", "owner_verified", "admin_verified"].includes(status)) {
    redirectWithError(feedbackPath, "Invalid verification status.");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("venues")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      verification_score: verificationScores[status],
      verification_status: status
    } as never)
    .eq("id", venueId);
  if (error) {
    redirectWithError(feedbackPath, error.message);
    return;
  }
  await logAudit(admin.id, "venue_verification_changed", "venue", venueId, { status, score: String(verificationScores[status]) });
  await logAudit(admin.id, "venue_readiness_recalculated", "venue", venueId, { reason: "verification_changed" });
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
  redirectWithFeedback(feedbackPath, "verification");
}

export async function updateVenueIdentityClassification(venueId: string, classification: VenueIdentityClassification, feedbackPath?: string) {
  const admin = await requireAdminProfile();
  if (!["lgbtq_venue", "lgbtq_friendly", "historic_site", "community_recommended"].includes(classification)) {
    redirectWithError(feedbackPath, "Invalid identity classification.");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("venues").update({ identity_classification: classification } as never).eq("id", venueId);
  if (error) {
    redirectWithError(feedbackPath, error.message);
    return;
  }
  await logAudit(admin.id, "venue_identity_changed", "venue", venueId, { classification });
  await logAudit(admin.id, "venue_readiness_recalculated", "venue", venueId, { reason: "identity_changed" });
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
  redirectWithFeedback(feedbackPath, "identity");
}

export async function updateVenueFeatured(venueId: string, featured: boolean, feedbackPath?: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("venues").update({ featured, featured_at: featured ? new Date().toISOString() : null } as never).eq("id", venueId);
  if (error) {
    redirectWithError(feedbackPath, error.message);
    return;
  }
  await logAudit(admin.id, featured ? "venue_featured" : "venue_unfeatured", "venue", venueId);
  await logAudit(admin.id, "venue_readiness_recalculated", "venue", venueId, { reason: "featured_changed" });
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
  redirectWithFeedback(feedbackPath, "featured");
}

export async function createBulkOperationDraft(operationType: VenueBulkOperationType) {
  const admin = await requireAdminProfile();
  if (!["bulk_verification", "bulk_classification", "bulk_feature"].includes(operationType)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("venue_bulk_operation_drafts").insert({ created_by: admin.id, operation_type: operationType } as never);
  await logAudit(admin.id, "venue_bulk_operation_draft_created", "venue_bulk_operation", null, { operationType });
  revalidatePath("/admin/venues");
}

export async function updateVenueSource(venueId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const submissionStatus = String(formData.get("submissionStatus") ?? "admin_created") as VenueSubmissionStatus;
  if (!["imported", "community_submitted", "owner_submitted", "admin_created"].includes(submissionStatus)) {
    redirectWithError(String(formData.get("feedbackPath") ?? ""), "Invalid submission status.");
    return;
  }

  const source = String(formData.get("source") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("venues")
    .update({
      source: source || null,
      source_id: sourceId || null,
      submission_status: submissionStatus
    } as never)
    .eq("id", venueId);
  if (error) {
    redirectWithError(String(formData.get("feedbackPath") ?? ""), error.message);
    return;
  }
  await logAudit(admin.id, "venue_source_changed", "venue", venueId, { source: source || null, sourceId: sourceId || null, submissionStatus });
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
  redirectWithFeedback(String(formData.get("feedbackPath") ?? ""), "source");
}

export async function reviewVenueClaim(claimId: string, status: Extract<VenueClaimStatus, "approved" | "rejected">, formData: FormData) {
  const admin = await requireAdminProfile();
  if (!["approved", "rejected"].includes(status)) return;

  const reviewNotes = String(formData.get("reviewNotes") ?? "").trim();
  const feedbackPath = String(formData.get("feedbackPath") ?? "");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("venue_claims").select("*").eq("id", claimId).maybeSingle();
  const claim = data as Tables<"venue_claims"> | null;
  if (!claim || claim.status !== "pending") {
    redirectWithFeedback(feedbackPath, "claim-unavailable");
    return;
  }

  await supabase
    .from("venue_claims")
    .update({
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      status
    } as never)
    .eq("id", claimId);

  if (status === "approved") {
    await supabase
      .from("venues")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by: claim.claimant_id,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        verification_score: verificationScores.owner_verified,
        verification_status: "owner_verified"
      } as never)
      .eq("id", claim.venue_id);
  }

  await logAudit(admin.id, status === "approved" ? "venue_claim_approved" : "venue_claim_rejected", "venue_claim", claimId, {
    claimantId: claim.claimant_id,
    reviewNotes: reviewNotes || null,
    venueId: claim.venue_id
  });
  if (status === "approved") {
    await logAudit(admin.id, "venue_owner_linked", "venue", claim.venue_id, { claimId, claimantId: claim.claimant_id });
    await logAudit(admin.id, "venue_verification_changed", "venue", claim.venue_id, { status: "owner_verified", score: String(verificationScores.owner_verified) });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/venue-claims");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${claim.venue_id}`);
  redirectWithFeedback(feedbackPath, status === "approved" ? "claim-approved" : "claim-rejected");
}

type DuplicateDetectionVenue = Pick<Tables<"venues">, "address" | "archived_at" | "city" | "country" | "id" | "latitude" | "longitude" | "name" | "website_url">;

function normalizeMatchText(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|bar|club|lounge|nyc|inc|llc)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function websiteDomain(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

function tokenSimilarity(first: string, second: string) {
  if (!first || !second) return 0;
  if (first === second) return 1;
  if (first.includes(second) || second.includes(first)) return 0.86;
  const firstTokens = new Set(first.split(" ").filter(Boolean));
  const secondTokens = new Set(second.split(" ").filter(Boolean));
  const overlap = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;
  return union ? overlap / union : 0;
}

function coordinateDistanceKm(first: DuplicateDetectionVenue, second: DuplicateDetectionVenue) {
  if (first.latitude === null || first.longitude === null || second.latitude === null || second.longitude === null) return null;
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(first.latitude)) * Math.cos(toRadians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreDuplicatePair(first: DuplicateDetectionVenue, second: DuplicateDetectionVenue) {
  const reasons: string[] = [];
  let score = 0;

  const sameCity = normalizeMatchText(first.city) === normalizeMatchText(second.city);
  const sameCountry = normalizeMatchText(first.country) === normalizeMatchText(second.country);
  if (sameCity && sameCountry) {
    score += 10;
    reasons.push("same_city");
  }

  const nameSimilarity = tokenSimilarity(normalizeMatchText(first.name), normalizeMatchText(second.name));
  if (nameSimilarity >= 0.85) {
    score += 35;
    reasons.push("similar_name");
  } else if (nameSimilarity >= 0.6) {
    score += 22;
    reasons.push("similar_name");
  }

  const firstAddress = normalizeMatchText(first.address);
  const secondAddress = normalizeMatchText(second.address);
  if (firstAddress && secondAddress && firstAddress === secondAddress) {
    score += 25;
    reasons.push("same_address");
  }

  const firstDomain = websiteDomain(first.website_url);
  const secondDomain = websiteDomain(second.website_url);
  if (firstDomain && secondDomain && firstDomain === secondDomain) {
    score += 35;
    reasons.push("same_website");
  }

  const distanceKm = coordinateDistanceKm(first, second);
  if (distanceKm !== null && distanceKm <= 0.25) {
    score += distanceKm <= 0.1 ? 20 : 15;
    reasons.push("nearby_coordinates");
  }

  if (!(sameCity && sameCountry) && !reasons.includes("same_website") && !reasons.includes("nearby_coordinates")) return null;
  const confidenceScore = Math.min(score, 100);
  if (confidenceScore < 60) return null;

  const confidenceLevel: VenueDuplicateCandidateLevel = confidenceScore >= 95 ? "high" : confidenceScore >= 80 ? "medium" : "low";
  return { confidenceLevel, confidenceScore, reasons };
}

function duplicatePairKey(firstId: string, secondId: string) {
  return [firstId, secondId].sort().join(":");
}

export async function generateVenueDuplicateCandidates() {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const [{ data: venueRows }, { data: existingRows }] = await Promise.all([
    supabase
      .from("venues")
      .select("id, name, address, city, country, website_url, latitude, longitude, archived_at")
      .is("archived_at", null)
      .limit(1000),
    supabase
      .from("venue_duplicate_candidates")
      .select("venue_a_id, venue_b_id")
      .limit(5000)
  ]);

  const venues = (venueRows ?? []) as DuplicateDetectionVenue[];
  const existingPairs = new Set(((existingRows ?? []) as Array<Pick<Tables<"venue_duplicate_candidates">, "venue_a_id" | "venue_b_id">>)
    .map((candidate) => duplicatePairKey(candidate.venue_a_id, candidate.venue_b_id)));
  const candidates: Array<Database["public"]["Tables"]["venue_duplicate_candidates"]["Insert"]> = [];

  for (let firstIndex = 0; firstIndex < venues.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < venues.length; secondIndex += 1) {
      const first = venues[firstIndex];
      const second = venues[secondIndex];
      const [venueAId, venueBId] = [first.id, second.id].sort();
      if (existingPairs.has(duplicatePairKey(venueAId, venueBId))) continue;

      const score = scoreDuplicatePair(first, second);
      if (!score) continue;
      candidates.push({
        confidence_level: score.confidenceLevel,
        confidence_score: score.confidenceScore,
        match_reasons: score.reasons,
        venue_a_id: venueAId,
        venue_b_id: venueBId
      });
      existingPairs.add(duplicatePairKey(venueAId, venueBId));
    }
  }

  if (candidates.length) {
    await supabase.from("venue_duplicate_candidates").insert(candidates as never);
  }

  await logAudit(admin.id, "venue_duplicate_candidates_generated", "venue_duplicate_candidate", null, {
    created: String(candidates.length)
  });
  revalidatePath("/admin");
  revalidatePath("/admin/duplicates");
  redirect(`/admin/duplicates?updated=generated&created=${candidates.length}`);
}

export async function dismissDuplicateCandidate(candidateId: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("venue_duplicate_candidates")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      status: "dismissed"
    } as never)
    .eq("id", candidateId);

  if (!error) {
    await logAudit(admin.id, "venue_duplicate_candidate_dismissed", "venue_duplicate_candidate", candidateId);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/duplicates");
  redirect("/admin/duplicates?updated=dismissed");
}

export async function createImportBatch(formData: FormData) {
  const admin = await requireAdminProfile();
  const sourceType = String(formData.get("sourceType") ?? "").trim();
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  if (!sourceType || !sourceName) return;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("import_batches")
    .insert({ created_by: admin.id, source_name: sourceName, source_type: sourceType } as never)
    .select("id")
    .single();
  const batch = data as Pick<Tables<"import_batches">, "id"> | null;

  if (batch) {
    await logAudit(admin.id, "import_batch_created", "import_batch", batch.id, { sourceName, sourceType });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
}

export async function reviewStagedVenue(stagedVenueId: string, batchId: string, status: ImportApprovalStatus) {
  const admin = await requireAdminProfile();
  if (!["approved", "rejected"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("venue_import_staging")
    .update({
      approval_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id
    } as never)
    .eq("id", stagedVenueId);
  await refreshImportBatchCounts(batchId);
  await logAudit(admin.id, status === "approved" ? "venue_import_approved" : "venue_import_rejected", "venue_import_staging", stagedVenueId, { batchId });
  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
}

export async function mergeStagedVenue(stagedVenueId: string, batchId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const existingVenueId = String(formData.get("existingVenueId") ?? "").trim();
  if (!existingVenueId) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("venue_import_staging")
    .update({
      approval_status: "merged",
      duplicate_existing_venue_id: existingVenueId,
      duplicate_review_status: "confirmed_duplicate",
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id
    } as never)
    .eq("id", stagedVenueId);
  await refreshImportBatchCounts(batchId);
  await logAudit(admin.id, "venue_import_merge_marked", "venue_import_staging", stagedVenueId, { batchId, existingVenueId });
  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${batchId}`);
}

export async function mergeDuplicateVenue(formData: FormData) {
  const admin = await requireAdminProfile();
  const sourceVenueId = String(formData.get("sourceVenueId") ?? "").trim();
  const targetVenueId = String(formData.get("targetVenueId") ?? "").trim();
  const mergeReason = String(formData.get("mergeReason") ?? "").trim();
  const candidateId = String(formData.get("candidateId") ?? "").trim();
  if (!sourceVenueId || !targetVenueId || sourceVenueId === targetVenueId) return;

  const supabase = await createSupabaseServerClient();
  const { data: sourceVenue } = await supabase.from("venues").select("id, name, archived_at").eq("id", sourceVenueId).maybeSingle();
  const { data: targetVenue } = await supabase.from("venues").select("id, name").eq("id", targetVenueId).maybeSingle();
  if (!sourceVenue || !targetVenue || (sourceVenue as Pick<Tables<"venues">, "archived_at">).archived_at) return;

  const [sourceFavorites, targetFavorites, sourceVisits, targetVisits, sourceTags] = await Promise.all([
    supabase.from("favorites").select("id, user_id").eq("venue_id", sourceVenueId).limit(1000),
    supabase.from("favorites").select("user_id").eq("venue_id", targetVenueId).limit(1000),
    supabase.from("visits").select("id, user_id, visited_on").eq("venue_id", sourceVenueId).limit(1000),
    supabase.from("visits").select("user_id, visited_on").eq("venue_id", targetVenueId).limit(1000),
    supabase.from("venue_tags").select("tag_id").eq("venue_id", sourceVenueId).limit(200)
  ]);

  const targetFavoriteUsers = new Set(((targetFavorites.data ?? []) as Array<{ user_id: string }>).map((favorite) => favorite.user_id));
  const duplicateFavoriteIds = ((sourceFavorites.data ?? []) as Array<{ id: string; user_id: string }>).filter((favorite) => targetFavoriteUsers.has(favorite.user_id)).map((favorite) => favorite.id);
  if (duplicateFavoriteIds.length) await supabase.from("favorites").delete().in("id", duplicateFavoriteIds);
  await supabase.from("favorites").update({ venue_id: targetVenueId } as never).eq("venue_id", sourceVenueId);

  const targetVisitKeys = new Set(((targetVisits.data ?? []) as Array<{ user_id: string; visited_on: string }>).map((visit) => `${visit.user_id}:${visit.visited_on}`));
  const movableVisitIds = ((sourceVisits.data ?? []) as Array<{ id: string; user_id: string; visited_on: string }>).filter((visit) => !targetVisitKeys.has(`${visit.user_id}:${visit.visited_on}`)).map((visit) => visit.id);
  if (movableVisitIds.length) await supabase.from("visits").update({ venue_id: targetVenueId } as never).in("id", movableVisitIds);

  await Promise.all([
    supabase.from("passport_stamps").update({ venue_id: targetVenueId } as never).eq("venue_id", sourceVenueId),
    supabase.from("journal_entries").update({ venue_id: targetVenueId } as never).eq("venue_id", sourceVenueId),
    supabase.from("venue_claims").update({ venue_id: targetVenueId } as never).eq("venue_id", sourceVenueId).neq("status", "rejected"),
    supabase.from("venue_import_staging").update({ duplicate_existing_venue_id: targetVenueId } as never).eq("duplicate_existing_venue_id", sourceVenueId)
  ]);

  const targetTagRows = ((await supabase.from("venue_tags").select("tag_id").eq("venue_id", targetVenueId).limit(200)).data ?? []) as Array<{ tag_id: string }>;
  const targetTags = new Set(targetTagRows.map((tag) => tag.tag_id));
  const missingTags = ((sourceTags.data ?? []) as Array<{ tag_id: string }>).filter((tag) => !targetTags.has(tag.tag_id)).map((tag) => ({ tag_id: tag.tag_id, venue_id: targetVenueId }));
  if (missingTags.length) await supabase.from("venue_tags").insert(missingTags as never);

  const archivedAt = new Date().toISOString();
  await supabase
    .from("venues")
    .update({
      archived_at: archivedAt,
      archived_by: admin.id,
      is_published: false,
      merge_notes: mergeReason || null,
      merged_into_venue_id: targetVenueId,
      review_status: "hidden"
    } as never)
    .eq("id", sourceVenueId);

  const preservedCounts = {
    duplicateFavoritesRemoved: duplicateFavoriteIds.length,
    favoritesMoved: Math.max(((sourceFavorites.data ?? []) as unknown[]).length - duplicateFavoriteIds.length, 0),
    journalsMoved: "all",
    passportStampsMoved: "all",
    tagsCopied: missingTags.length,
    visitConflictsKeptOnArchivedVenue: ((sourceVisits.data ?? []) as unknown[]).length - movableVisitIds.length,
    visitsMoved: movableVisitIds.length
  };

  const { data: mergeRecord } = await supabase
    .from("venue_merge_records")
    .insert({
      created_by: admin.id,
      merge_reason: mergeReason || null,
      preserved_counts: preservedCounts,
      source_venue_id: sourceVenueId,
      target_venue_id: targetVenueId
    } as never)
    .select("id")
    .single();

  const mergeRecordId = (mergeRecord as { id: string } | null)?.id ?? null;
  await logAudit(admin.id, "venue_duplicate_merged", "venue", sourceVenueId, {
    mergeRecordId,
    reason: mergeReason || null,
    sourceVenueId,
    targetVenueId
  });
  await logAudit(admin.id, "venue_archived_after_merge", "venue", sourceVenueId, { targetVenueId });
  const candidateUpdate = supabase
    .from("venue_duplicate_candidates")
    .update({
      reviewed_at: archivedAt,
      reviewed_by: admin.id,
      status: "merged"
    } as never);
  const { data: mergedCandidate } = await (candidateId
    ? candidateUpdate.eq("id", candidateId).select("id").maybeSingle()
    : candidateUpdate
      .or(`and(venue_a_id.eq.${sourceVenueId},venue_b_id.eq.${targetVenueId}),and(venue_a_id.eq.${targetVenueId},venue_b_id.eq.${sourceVenueId})`)
      .eq("status", "pending")
      .select("id")
      .maybeSingle());
  const mergedCandidateId = (mergedCandidate as { id: string } | null)?.id ?? candidateId;
  if (mergedCandidateId) {
    await logAudit(admin.id, "venue_duplicate_candidate_merged", "venue_duplicate_candidate", mergedCandidateId, {
      sourceVenueId,
      targetVenueId
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/duplicates");
  revalidatePath("/admin/duplicates/compare");
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${sourceVenueId}`);
  revalidatePath(`/admin/venues/${targetVenueId}`);
  redirect(`/admin/duplicates?updated=merged`);
}

export async function updateJournalModeration(entryId: string, status: ModerationStatus) {
  const admin = await requireAdminProfile();
  if (!["active", "hidden", "flagged"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("journal_entries").update({ moderation_status: status } as never).eq("id", entryId);
  await logAudit(admin.id, "journal_moderation_changed", "journal", entryId, { status });
  revalidatePath("/admin/journals");
}

export async function updateCommentModeration(commentId: string, status: ModerationStatus) {
  const admin = await requireAdminProfile();
  if (!["active", "hidden", "flagged"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("journal_comments").update({ moderation_status: status } as never).eq("id", commentId);
  await logAudit(admin.id, "comment_moderation_changed", "comment", commentId, { status });
  revalidatePath("/admin/comments");
}

export async function deleteComment(commentId: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  await supabase.from("journal_comments").delete().eq("id", commentId);
  await logAudit(admin.id, "comment_removed", "comment", commentId);
  revalidatePath("/admin/comments");
}

export async function createModerationFlag(targetType: Tables<"moderation_flags">["target_type"], targetId: string, reason: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  await supabase.from("moderation_flags").insert({ created_by: admin.id, reason, target_id: targetId, target_type: targetType } as never);
  await logAudit(admin.id, "content_flagged", targetType, targetId, { reason });
  revalidatePath("/admin/reports");
}

export async function resolveModerationFlag(flagId: string, status: "resolved" | "dismissed") {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  await supabase.from("moderation_flags").update({ resolved_at: new Date().toISOString(), resolved_by: admin.id, status } as never).eq("id", flagId);
  await logAudit(admin.id, "moderation_flag_closed", "report", flagId, { status });
  revalidatePath("/admin/reports");
}
