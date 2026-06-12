"use server";

import { revalidatePath } from "next/cache";
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

export async function updateVenueStatus(venueId: string, status: VenueStatus) {
  const admin = await requireAdminProfile();
  if (!["active", "hidden", "pending_review"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("venues").update({ is_published: status === "active", review_status: status } as never).eq("id", venueId);
  await logAudit(admin.id, "venue_status_changed", "venue", venueId, { status });
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function updateVenueMetadata(venueId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const category = String(formData.get("category") ?? "bar") as Database["public"]["Enums"]["venue_category"];
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("venues")
    .update({
      address: String(formData.get("address") ?? ""),
      category,
      description: String(formData.get("description") ?? ""),
      name: String(formData.get("name") ?? ""),
      neighborhood: String(formData.get("neighborhood") ?? ""),
      website_url: String(formData.get("websiteUrl") ?? "")
    } as never)
    .eq("id", venueId);
  await logAudit(admin.id, "venue_metadata_updated", "venue", venueId);
  revalidatePath("/admin/venues");
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function updateVenueVerification(venueId: string, status: VenueVerificationStatus) {
  const admin = await requireAdminProfile();
  if (!["unverified", "community_verified", "owner_verified", "admin_verified"].includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("venues")
    .update({
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
      verification_score: verificationScores[status],
      verification_status: status
    } as never)
    .eq("id", venueId);
  await logAudit(admin.id, "venue_verification_changed", "venue", venueId, { status, score: String(verificationScores[status]) });
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function updateVenueIdentityClassification(venueId: string, classification: VenueIdentityClassification) {
  const admin = await requireAdminProfile();
  if (!["lgbtq_venue", "lgbtq_friendly", "historic_site", "community_recommended"].includes(classification)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("venues").update({ identity_classification: classification } as never).eq("id", venueId);
  await logAudit(admin.id, "venue_identity_changed", "venue", venueId, { classification });
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
}

export async function updateVenueSource(venueId: string, formData: FormData) {
  const admin = await requireAdminProfile();
  const submissionStatus = String(formData.get("submissionStatus") ?? "admin_created") as VenueSubmissionStatus;
  if (!["imported", "community_submitted", "owner_submitted", "admin_created"].includes(submissionStatus)) return;

  const source = String(formData.get("source") ?? "").trim();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("venues")
    .update({
      source: source || null,
      source_id: sourceId || null,
      submission_status: submissionStatus
    } as never)
    .eq("id", venueId);
  await logAudit(admin.id, "venue_source_changed", "venue", venueId, { source: source || null, sourceId: sourceId || null, submissionStatus });
  revalidatePath("/admin");
  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  revalidatePath(`/admin/venues/${venueId}`);
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
