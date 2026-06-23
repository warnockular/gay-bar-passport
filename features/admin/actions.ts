"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminProfile } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stageImportedVenueCandidates } from "@/services/imports/import-service";
import { travelerTagOptions, travelerTagSlugs } from "@/lib/traveler-tags";
import { venueCategoryValues } from "@/lib/venue-categories";
import type { Database, Tables } from "@/types/database";

type ProfileRole = Tables<"profiles">["role"];
type ProfileStatus = Tables<"profiles">["status"];
type VenueStatus = Tables<"venues">["review_status"];
type VenueCategory = Database["public"]["Enums"]["venue_category"];
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

function normalizeCsvHeader(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseSuggestedTags(value: string) {
  return value
    .split(/[|;,]/g)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function categoryFromCsv(value: string) {
  const normalized = normalizeCsvHeader(value);
  return venueCategoryValues.includes(normalized as never) ? normalized as VenueCategory : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringFrom(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function tagSlugFromLabel(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function nullableFormString(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value || null;
}

function parseNullableFormNumber(formData: FormData, key: string, label: string) {
  const value = formString(formData, key);
  if (!value) return { error: null, value: null };
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return { error: `${label} must be numeric.`, value: null };
  return { error: null, value: parsed };
}

function candidateField(candidate: Tables<"venue_import_staging">, key: string) {
  const raw = jsonObject(candidate.raw_data);
  const metadata = jsonObject(candidate.source_metadata);
  const address = jsonObject(candidate.address_components);
  const direct = candidate[key as keyof Tables<"venue_import_staging">];
  return stringFrom(direct, address[key], metadata[key], raw[key]);
}

function candidateCategory(candidate: Tables<"venue_import_staging">) {
  const raw = jsonObject(candidate.raw_data);
  return categoryFromCsv(candidate.suggested_category ?? "") ?? categoryFromCsv(String(raw.category ?? ""));
}

function validateStagedCandidateApproval(candidate: Tables<"venue_import_staging">) {
  const name = candidateField(candidate, "name");
  const category = candidateCategory(candidate);
  const city = candidateField(candidate, "city");
  const country = candidateField(candidate, "country");
  if (!name || !category || !city || !country) return null;
  return { category, city, country, name };
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
  if (!["active", "archived", "hidden", "needs_review", "pending_review", "rejected"].includes(status)) {
    redirectWithError(feedbackPath, "Invalid review status.");
    return;
  }

  const supabase = await createSupabaseServerClient();
  const reviewedAt = new Date().toISOString();
  const reviewStatus = status === "hidden" ? "needs_review" : status;
  const updatePayload: Database["public"]["Tables"]["venues"]["Update"] = {
    is_published: reviewStatus === "active",
    review_status: reviewStatus,
    reviewed_at: reviewedAt,
    reviewed_by: admin.id
  };

  if (reviewStatus === "archived") {
    updatePayload.archived_at = reviewedAt;
    updatePayload.archived_by = admin.id;
  } else if (["active", "needs_review", "pending_review"].includes(reviewStatus)) {
    updatePayload.archived_at = null;
    updatePayload.archived_by = null;
  }

  const { error } = await supabase.from("venues").update(updatePayload as never).eq("id", venueId);
  if (error) {
    redirectWithError(feedbackPath, error.message);
    return;
  }
  const auditAction = reviewStatus === "archived" ? "venue_archived" : reviewStatus === "rejected" ? "venue_rejected" : "venue_status_changed";
  await logAudit(admin.id, auditAction, "venue", venueId, { status: reviewStatus });
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
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
      region: String(formData.get("region") ?? "") || null,
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

export async function updateVenueTravelerTags(venueId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const feedbackPath = String(formData.get("feedbackPath") ?? "");
  const publicPath = String(formData.get("publicPath") ?? "");
  const selectedSlugs = Array.from(new Set(formData.getAll("tagSlugs").map(String)))
    .filter((slug) => travelerTagSlugs.includes(slug as never));
  const supabase = await createSupabaseServerClient();

  const { error: tagError } = await supabase
    .from("tags")
    .upsert(travelerTagOptions.map((tag) => ({ name: tag.name, slug: tag.slug })) as never, { onConflict: "slug" });
  if (tagError) {
    redirectWithError(feedbackPath, tagError.message);
    return;
  }

  const { data: controlledTags, error: controlledTagsError } = await supabase
    .from("tags")
    .select("id, slug")
    .in("slug", travelerTagSlugs);
  if (controlledTagsError) {
    redirectWithError(feedbackPath, controlledTagsError.message);
    return;
  }

  const controlledTagRows = (controlledTags ?? []) as Array<Pick<Tables<"tags">, "id" | "slug">>;
  const controlledTagIds = controlledTagRows.map((tag) => tag.id);
  const selectedTagIds = controlledTagRows.filter((tag) => selectedSlugs.includes(tag.slug)).map((tag) => tag.id);

  if (controlledTagIds.length) {
    const { error: deleteError } = await supabase
      .from("venue_tags")
      .delete()
      .eq("venue_id", venueId)
      .in("tag_id", controlledTagIds);
    if (deleteError) {
      redirectWithError(feedbackPath, deleteError.message);
      return;
    }
  }

  if (selectedTagIds.length) {
    const { error: insertError } = await supabase
      .from("venue_tags")
      .insert(selectedTagIds.map((tagId) => ({ tag_id: tagId, venue_id: venueId })) as never);
    if (insertError) {
      redirectWithError(feedbackPath, insertError.message);
      return;
    }
  }

  await logAudit(admin.id, "venue_traveler_tags_updated", "venue", venueId, {
    tagSlugs: selectedSlugs.join(", ")
  });
  revalidatePath("/venues");
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueId}`);
  if (publicPath.startsWith("/venues/")) revalidatePath(publicPath);
  redirectWithFeedback(feedbackPath, "traveler-tags");
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

function normalizeAddress(value?: string | null) {
  return normalizeMatchText(value)
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\broad\b/g, "rd")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\bwest\b/g, "w")
    .replace(/\beast\b/g, "e")
    .replace(/\bnorth\b/g, "n")
    .replace(/\bsouth\b/g, "s")
    .replace(/\s+/g, " ")
    .trim();
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

  const firstAddress = normalizeAddress(first.address);
  const secondAddress = normalizeAddress(second.address);
  if (firstAddress && secondAddress && firstAddress === secondAddress) {
    score += 40;
    reasons.push("same_address");
  }

  const firstDomain = websiteDomain(first.website_url);
  const secondDomain = websiteDomain(second.website_url);
  if (firstDomain && secondDomain && firstDomain === secondDomain) {
    score += 40;
    reasons.push("same_website");
  }

  const distanceKm = coordinateDistanceKm(first, second);
  if (distanceKm !== null && distanceKm <= 0.25) {
    score += distanceKm <= 0.1 ? 20 : 15;
    reasons.push("nearby_coordinates");
  }

  const hasStrongSamePlaceSignal = sameCity && sameCountry && (reasons.includes("same_website") || reasons.includes("same_address"));
  if (!(sameCity && sameCountry) && !reasons.includes("same_website") && !reasons.includes("nearby_coordinates")) return null;
  const confidenceScore = Math.min(Math.max(score, hasStrongSamePlaceSignal ? 80 : score), 100);
  if (confidenceScore < 60 && !hasStrongSamePlaceSignal) return null;

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
      .select("venue_a_id, venue_b_id, status")
      .limit(5000)
  ]);

  const venues = (venueRows ?? []) as DuplicateDetectionVenue[];
  const existingPairs = new Set(((existingRows ?? []) as Array<Pick<Tables<"venue_duplicate_candidates">, "status" | "venue_a_id" | "venue_b_id">>)
    .filter((candidate) => candidate.status !== "pending")
    .map((candidate) => duplicatePairKey(candidate.venue_a_id, candidate.venue_b_id)));
  const pendingPairs = new Set(((existingRows ?? []) as Array<Pick<Tables<"venue_duplicate_candidates">, "status" | "venue_a_id" | "venue_b_id">>)
    .filter((candidate) => candidate.status === "pending")
    .map((candidate) => duplicatePairKey(candidate.venue_a_id, candidate.venue_b_id)));
  const candidates: Array<Database["public"]["Tables"]["venue_duplicate_candidates"]["Insert"]> = [];

  for (let firstIndex = 0; firstIndex < venues.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < venues.length; secondIndex += 1) {
      const first = venues[firstIndex];
      const second = venues[secondIndex];
      const [venueAId, venueBId] = [first.id, second.id].sort();
      if (existingPairs.has(duplicatePairKey(venueAId, venueBId))) continue;
      if (pendingPairs.has(duplicatePairKey(venueAId, venueBId))) continue;

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

export async function importCuratedCsvToStaging(formData: FormData) {
  const admin = await requireAdminProfile();
  const sourceType = String(formData.get("sourceType") ?? "curated_csv").trim() || "curated_csv";
  const sourceName = String(formData.get("sourceName") ?? "").trim();
  const pastedCsv = String(formData.get("csvData") ?? "").trim();
  const csvFile = formData.get("csvFile");
  const uploadedCsv = csvFile instanceof File && csvFile.size > 0 ? (await csvFile.text()).trim() : "";
  const csv = uploadedCsv || pastedCsv;

  if (!sourceName || !csv) {
    redirect("/admin/imports?error=missing-csv");
  }

  const result = await stageImportedVenueCandidates({
    createdBy: admin.id,
    csv,
    sourceName,
    sourceType
  });

  if (result.error) {
    redirect(result.batchId ? `/admin/imports/${result.batchId}?error=${encodeURIComponent(result.error)}` : `/admin/imports?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  if (result.batchId) revalidatePath(`/admin/imports/${result.batchId}`);
  redirect(`/admin/imports/${result.batchId}?updated=csv-staged`);
}

export async function importSelectedGooglePlacesToStaging(formData: FormData) {
  const admin = await requireAdminProfile();
  const selectedResults = formData.getAll("selectedGooglePlace").map(String);
  if (!selectedResults.length) redirect("/admin/imports/google?error=no-selection");

  const rawResults = selectedResults.flatMap((value) => {
    try {
      return [JSON.parse(value) as unknown];
    } catch {
      return [];
    }
  });
  if (!rawResults.length) redirect("/admin/imports/google?error=invalid-selection");

  const sourceName = String(formData.get("sourceName") ?? "").trim() || "Google Places import";
  const result = await stageImportedVenueCandidates({
    createdBy: admin.id,
    rawResults,
    sourceName,
    sourceType: "google_places"
  });

  if (result.error) {
    redirect(result.batchId ? `/admin/imports/${result.batchId}?error=${encodeURIComponent(result.error)}` : `/admin/imports/google?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  if (result.batchId) revalidatePath(`/admin/imports/${result.batchId}`);
  redirect(`/admin/imports/${result.batchId}?updated=google-staged`);
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

export async function updateStagedVenueCandidate(candidateId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: candidateData } = await supabase
    .from("venue_import_staging")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();
  const candidate = candidateData as Tables<"venue_import_staging"> | null;
  if (!candidate) redirect("/admin/imports?error=candidate-not-found");
  if (candidate.approval_status === "approved" || candidate.approved_venue_id) {
    redirect(`/admin/imports/staged/${candidateId}?error=already-approved`);
  }

  const latitude = parseNullableFormNumber(formData, "latitude", "Latitude");
  const longitude = parseNullableFormNumber(formData, "longitude", "Longitude");
  const confidenceScore = parseNullableFormNumber(formData, "confidenceScore", "Confidence score");
  const numberError = latitude.error ?? longitude.error ?? confidenceScore.error;
  if (numberError) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(numberError)}`);
  if (confidenceScore.value !== null && (confidenceScore.value < 0 || confidenceScore.value > 100)) {
    redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent("Confidence score must be between 0 and 100.")}`);
  }

  const category = nullableFormString(formData, "category");
  if (category && !venueCategoryValues.includes(category as never)) {
    redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent("Choose a valid category.")}`);
  }

  const addressComponents = {
    ...jsonObject(candidate.address_components),
    address: nullableFormString(formData, "address"),
    city: nullableFormString(formData, "city"),
    country: nullableFormString(formData, "country"),
    neighborhood: nullableFormString(formData, "neighborhood"),
    postal_code: nullableFormString(formData, "postalCode"),
    region: nullableFormString(formData, "region")
  };
  const sourceMetadata = {
    ...jsonObject(candidate.source_metadata),
    description: nullableFormString(formData, "description"),
    image_url: nullableFormString(formData, "imageUrl"),
    opening_hours: nullableFormString(formData, "openingHours"),
    website_url: nullableFormString(formData, "websiteUrl")
  };
  const suggestedTags = parseSuggestedTags(formString(formData, "suggestedTags"));
  const nextValues = {
    address: addressComponents.address,
    category,
    city: nullableFormString(formData, "city"),
    confidence_score: confidenceScore.value,
    country: nullableFormString(formData, "country"),
    description: sourceMetadata.description,
    image_url: sourceMetadata.image_url,
    latitude: latitude.value,
    longitude: longitude.value,
    name: nullableFormString(formData, "name"),
    neighborhood: addressComponents.neighborhood,
    notes: nullableFormString(formData, "notes"),
    opening_hours: sourceMetadata.opening_hours,
    phone: nullableFormString(formData, "phone"),
    postal_code: nullableFormString(formData, "postalCode"),
    region: addressComponents.region,
    suggested_tags: suggestedTags.join(", "),
    website_url: sourceMetadata.website_url
  };
  const previousValues = {
    address: candidateField(candidate, "address"),
    category: candidate.suggested_category,
    city: candidateField(candidate, "city"),
    confidence_score: candidate.confidence_score,
    country: candidateField(candidate, "country"),
    description: candidateField(candidate, "description"),
    image_url: candidateField(candidate, "image_url"),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    name: candidateField(candidate, "name"),
    neighborhood: candidateField(candidate, "neighborhood"),
    notes: candidate.review_notes,
    opening_hours: candidateField(candidate, "opening_hours"),
    phone: candidate.phone,
    postal_code: candidate.postal_code,
    region: candidateField(candidate, "region"),
    suggested_tags: candidate.suggested_tags.join(", "),
    website_url: candidateField(candidate, "website_url")
  };
  const changedFields = Object.entries(nextValues)
    .filter(([key, value]) => String(previousValues[key as keyof typeof previousValues] ?? "") !== String(value ?? ""))
    .map(([key]) => key);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("venue_import_staging")
    .update({
      address_components: addressComponents,
      city: nullableFormString(formData, "city"),
      confidence_score: confidenceScore.value,
      country: nullableFormString(formData, "country"),
      edited_at: now,
      edited_by: admin.id,
      latitude: latitude.value,
      longitude: longitude.value,
      name: nullableFormString(formData, "name"),
      phone: nullableFormString(formData, "phone"),
      postal_code: nullableFormString(formData, "postalCode"),
      review_notes: nullableFormString(formData, "notes"),
      source_metadata: sourceMetadata,
      suggested_category: category,
      suggested_tags: suggestedTags,
      updated_at: now
    } as never)
    .eq("id", candidateId);

  if (error) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(error.message)}`);
  await logAudit(admin.id, "import_candidate_edited", "venue_import_staging", candidateId, {
    changedFields: changedFields.length ? changedFields.join(", ") : "none"
  });
  revalidatePath(`/admin/imports/staged/${candidateId}`);
  revalidatePath(`/admin/imports/${candidate.import_batch_id}`);
  redirect(`/admin/imports/staged/${candidateId}?updated=edited`);
}

export async function approveStagedVenueAsNew(candidateId: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: candidateData } = await supabase
    .from("venue_import_staging")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();
  const candidate = candidateData as Tables<"venue_import_staging"> | null;

  if (!candidate) redirect("/admin/imports?error=candidate-not-found");
  if (candidate.approval_status === "approved" || candidate.approved_venue_id) {
    redirect(`/admin/imports/staged/${candidateId}?error=already-approved`);
  }

  const raw = jsonObject(candidate.raw_data);
  const metadata = jsonObject(candidate.source_metadata);
  const addressComponents = jsonObject(candidate.address_components);
  const validated = validateStagedCandidateApproval(candidate);

  if (!validated) {
    redirect(`/admin/imports/staged/${candidateId}?error=missing-required-fields`);
  }

  const venueId = crypto.randomUUID();
  const { category, city, country, name } = validated;
  const now = new Date().toISOString();
  const slug = `${slugify(`${name}-${city}`)}-${venueId.slice(0, 8)}`;
  const insertedVenue = {
    address: stringFrom(addressComponents.address, metadata.address, raw.address),
    category,
    city,
    city_slug: slugify(city),
    country,
    country_slug: slugify(country),
    description: stringFrom(metadata.description, raw.description, candidate.review_notes),
    id: venueId,
    identity_classification: "community_recommended",
    image_url: stringFrom(metadata.image_url, raw.image_url),
    is_lgbtq_owned: false,
    is_published: false,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    name,
    neighborhood: stringFrom(addressComponents.neighborhood, metadata.neighborhood, raw.neighborhood),
    opening_hours: stringFrom(metadata.opening_hours, raw.opening_hours),
    phone: candidate.phone,
    postal_code: candidate.postal_code,
    region: stringFrom(addressComponents.region, metadata.region, raw.region),
    review_status: "pending_review",
    reviewed_at: null,
    reviewed_by: null,
    slug,
    source: "imported",
    source_id: candidate.id,
    submitted_by: null,
    submission_status: "imported",
    verification_score: 0,
    verification_status: "unverified",
    website_url: stringFrom(metadata.website_url, raw.website_url)
  } satisfies Database["public"]["Tables"]["venues"]["Insert"];

  const { error: venueError } = await supabase.from("venues").insert(insertedVenue as never);
  if (venueError) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(venueError.message)}`);

  const selectedTagSlugs = Array.from(new Set(candidate.suggested_tags.map(tagSlugFromLabel)))
    .filter((slug) => travelerTagSlugs.includes(slug as never));

  if (selectedTagSlugs.length) {
    await supabase
      .from("tags")
      .upsert(travelerTagOptions.map((tag) => ({ name: tag.name, slug: tag.slug })) as never, { onConflict: "slug" });
    const { data: tagRows } = await supabase.from("tags").select("id, slug").in("slug", selectedTagSlugs);
    const venueTags = ((tagRows ?? []) as Array<Pick<Tables<"tags">, "id" | "slug">>).map((tag) => ({ tag_id: tag.id, venue_id: venueId }));
    if (venueTags.length) await supabase.from("venue_tags").insert(venueTags as never);
  }

  const { error: candidateError } = await supabase
    .from("venue_import_staging")
    .update({
      approval_status: "approved",
      approved_at: now,
      approved_by: admin.id,
      approved_venue_id: venueId,
      reviewed_at: now,
      reviewed_by: admin.id
    } as never)
    .eq("id", candidateId)
    .neq("approval_status", "approved")
    .is("approved_venue_id", null);

  if (candidateError) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(candidateError.message)}`);

  await refreshImportBatchCounts(candidate.import_batch_id);
  await logAudit(admin.id, "import_candidate_approved_as_new_venue", "venue_import_staging", candidateId, {
    approvedVenueId: venueId,
    source: candidate.source,
    sourceId: candidate.source_id
  });
  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${candidate.import_batch_id}`);
  revalidatePath(`/admin/imports/staged/${candidateId}`);
  revalidatePath("/admin/venues/review");
  redirect(`/admin/imports/staged/${candidateId}?updated=approved`);
}

export async function updateExistingVenueFromStagedCandidate(candidateId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const venueId = String(formData.get("venueId") ?? "").trim();
  if (!venueId) redirect(`/admin/imports/staged/${candidateId}?error=missing-venue`);

  const supabase = await createSupabaseServerClient();
  const { data: candidateData } = await supabase
    .from("venue_import_staging")
    .select("*")
    .eq("id", candidateId)
    .maybeSingle();
  const candidate = candidateData as Tables<"venue_import_staging"> | null;
  if (!candidate) redirect("/admin/imports?error=candidate-not-found");
  if (candidate.approval_status === "approved" || candidate.approved_venue_id) {
    redirect(`/admin/imports/staged/${candidateId}?error=already-approved`);
  }
  if (!validateStagedCandidateApproval(candidate)) {
    redirect(`/admin/imports/staged/${candidateId}?error=missing-required-fields`);
  }

  const raw = jsonObject(candidate.raw_data);
  const metadata = jsonObject(candidate.source_metadata);
  const selectedSafeFields = new Set(formData.getAll("safeFields").map(String));
  const safeValues = {
    image_url: stringFrom(metadata.image_url, raw.image_url),
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    opening_hours: stringFrom(metadata.opening_hours, raw.opening_hours),
    phone: candidate.phone,
    postal_code: candidate.postal_code,
    website_url: stringFrom(metadata.website_url, raw.website_url)
  } satisfies Pick<Database["public"]["Tables"]["venues"]["Update"], "image_url" | "latitude" | "longitude" | "opening_hours" | "phone" | "postal_code" | "website_url">;

  const updatePayload: Database["public"]["Tables"]["venues"]["Update"] = {};
  if (selectedSafeFields.has("website_url") && safeValues.website_url) updatePayload.website_url = safeValues.website_url;
  if (selectedSafeFields.has("phone") && safeValues.phone) updatePayload.phone = safeValues.phone;
  if (selectedSafeFields.has("opening_hours") && safeValues.opening_hours) updatePayload.opening_hours = safeValues.opening_hours;
  if (selectedSafeFields.has("image_url") && safeValues.image_url) updatePayload.image_url = safeValues.image_url;
  if (selectedSafeFields.has("coordinates") && safeValues.latitude !== null && safeValues.longitude !== null) {
    updatePayload.latitude = safeValues.latitude;
    updatePayload.longitude = safeValues.longitude;
  }
  const changedFields = Object.keys(updatePayload);
  if (!changedFields.length) redirect(`/admin/imports/staged/${candidateId}?error=no-safe-fields`);

  const { error: venueError } = await supabase.from("venues").update(updatePayload as never).eq("id", venueId);
  if (venueError) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(venueError.message)}`);

  const now = new Date().toISOString();
  const { error: candidateError } = await supabase
    .from("venue_import_staging")
    .update({
      approval_status: "approved",
      approved_at: now,
      approved_by: admin.id,
      approved_venue_id: venueId,
      matched_venue_id: venueId,
      reviewed_at: now,
      reviewed_by: admin.id
    } as never)
    .eq("id", candidateId)
    .neq("approval_status", "approved")
    .is("approved_venue_id", null);
  if (candidateError) redirect(`/admin/imports/staged/${candidateId}?error=${encodeURIComponent(candidateError.message)}`);

  await refreshImportBatchCounts(candidate.import_batch_id);
  await logAudit(admin.id, "import_candidate_updated_existing_venue", "venue_import_staging", candidateId, {
    candidateId,
    fieldsChanged: changedFields.join(", "),
    venueId
  });
  revalidatePath("/admin");
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${candidate.import_batch_id}`);
  revalidatePath(`/admin/imports/staged/${candidateId}`);
  revalidatePath(`/admin/venues/${venueId}`);
  redirect(`/admin/imports/staged/${candidateId}?updated=updated-existing`);
}

export async function rejectStagedVenueCandidate(candidateId: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: candidateData } = await supabase.from("venue_import_staging").select("import_batch_id, approval_status").eq("id", candidateId).maybeSingle();
  const candidate = candidateData as Pick<Tables<"venue_import_staging">, "approval_status" | "import_batch_id"> | null;
  if (!candidate || candidate.approval_status === "approved") redirect(`/admin/imports/staged/${candidateId}?error=not-reviewable`);

  const now = new Date().toISOString();
  await supabase
    .from("venue_import_staging")
    .update({ approval_status: "rejected", reviewed_at: now, reviewed_by: admin.id } as never)
    .eq("id", candidateId);
  await refreshImportBatchCounts(candidate.import_batch_id);
  await logAudit(admin.id, "import_candidate_rejected", "venue_import_staging", candidateId);
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${candidate.import_batch_id}`);
  revalidatePath(`/admin/imports/staged/${candidateId}`);
  redirect(`/admin/imports/staged/${candidateId}?updated=rejected`);
}

export async function archiveStagedVenueCandidate(candidateId: string) {
  const admin = await requireAdminProfile();
  const supabase = await createSupabaseServerClient();
  const { data: candidateData } = await supabase.from("venue_import_staging").select("import_batch_id, approval_status").eq("id", candidateId).maybeSingle();
  const candidate = candidateData as Pick<Tables<"venue_import_staging">, "approval_status" | "import_batch_id"> | null;
  if (!candidate || candidate.approval_status === "approved") redirect(`/admin/imports/staged/${candidateId}?error=not-reviewable`);

  const now = new Date().toISOString();
  await supabase
    .from("venue_import_staging")
    .update({ approval_status: "archived", reviewed_at: now, reviewed_by: admin.id } as never)
    .eq("id", candidateId);
  await logAudit(admin.id, "import_candidate_archived", "venue_import_staging", candidateId);
  revalidatePath("/admin/imports");
  revalidatePath(`/admin/imports/${candidate.import_batch_id}`);
  revalidatePath(`/admin/imports/staged/${candidateId}`);
  redirect(`/admin/imports/staged/${candidateId}?updated=archived`);
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
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (!sourceVenueId || !targetVenueId || sourceVenueId === targetVenueId) return;

  const supabase = await createSupabaseServerClient();
  const { data: sourceVenue } = await supabase.from("venues").select("id, name, archived_at").eq("id", sourceVenueId).maybeSingle();
  const { data: targetVenue } = await supabase.from("venues").select("id, name").eq("id", targetVenueId).maybeSingle();
  if (!sourceVenue || !targetVenue || (sourceVenue as Pick<Tables<"venues">, "archived_at">).archived_at) return;
  const expectedConfirmation = `I understand this will archive ${(sourceVenue as Pick<Tables<"venues">, "name">).name} and keep ${(targetVenue as Pick<Tables<"venues">, "name">).name}.`;
  if (confirmation !== expectedConfirmation) {
    const comparePath = `/admin/duplicates/compare?sourceVenueId=${encodeURIComponent(sourceVenueId)}&targetVenueId=${encodeURIComponent(targetVenueId)}${candidateId ? `&candidateId=${encodeURIComponent(candidateId)}` : ""}&error=confirmation`;
    redirect(comparePath);
  }

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
      review_status: "archived"
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
