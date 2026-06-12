"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { venueClaimSchema, type VenueClaimValues } from "@/schemas/venue-claim";
import { venueSubmissionSchema, type VenueSubmissionValues } from "@/schemas/venue-submission";

export type VenueSubmissionResult = {
  fieldErrors?: Partial<Record<keyof VenueSubmissionValues, string[]>>;
  message: string;
  ok: boolean;
};
export type VenueClaimResult = {
  fieldErrors?: Partial<Record<keyof VenueClaimValues, string[]>>;
  message: string;
  ok: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function submitCommunityVenue(formData: FormData): Promise<VenueSubmissionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is required to submit venues." };
  }

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before submitting a venue." };

  const parsed = venueSubmissionSchema.safeParse({
    address: formData.get("address"),
    category: formData.get("category"),
    city: formData.get("city"),
    country: formData.get("country"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    name: formData.get("name"),
    websiteUrl: formData.get("websiteUrl")
  });

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return { fieldErrors, ok: false, message: "Check the highlighted fields." };
  }

  const venueId = crypto.randomUUID();
  const slugBase = slugify(`${parsed.data.name}-${parsed.data.city}`);
  const slug = `${slugBase}-${venueId.slice(0, 8)}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("venues").insert({
    address: parsed.data.address,
    category: parsed.data.category,
    city: parsed.data.city,
    city_slug: slugify(parsed.data.city),
    country: parsed.data.country,
    country_slug: slugify(parsed.data.country),
    description: parsed.data.description,
    id: venueId,
    identity_classification: "community_recommended",
    image_url: parsed.data.imageUrl || null,
    is_lgbtq_owned: false,
    is_published: false,
    name: parsed.data.name,
    neighborhood: parsed.data.address,
    review_status: "pending_review",
    slug,
    source: "community_submission",
    source_id: venueId,
    submission_status: "community_submitted",
    verification_score: 0,
    verification_status: "unverified",
    website_url: parsed.data.websiteUrl || null
  } as never);

  if (error) return { ok: false, message: `Venue could not be submitted: ${error.message}` };

  await supabase.from("audit_logs").insert({
    action: "venue_community_submitted",
    actor_id: user.id,
    metadata: { city: parsed.data.city, country: parsed.data.country, name: parsed.data.name },
    target_id: venueId,
    target_type: "venue"
  } as never);

  revalidatePath("/admin/venues");
  revalidatePath("/admin/venues/review");
  return { ok: true, message: "Venue submitted. An admin will review it before publication." };
}

export async function requestVenueOwnership(venueId: string, venueSlug: string, formData: FormData): Promise<VenueClaimResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is required to request venue ownership." };
  }

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before requesting ownership." };

  const parsed = venueClaimSchema.safeParse({
    claimantEmail: formData.get("claimantEmail"),
    claimantName: formData.get("claimantName"),
    evidenceUrl: formData.get("evidenceUrl"),
    notes: formData.get("notes"),
    roleTitle: formData.get("roleTitle")
  });

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    return { fieldErrors, ok: false, message: "Check the highlighted fields." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingClaim } = await supabase
    .from("venue_claims")
    .select("id")
    .eq("venue_id", venueId)
    .eq("claimant_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingClaim) {
    return { ok: false, message: "You already have a pending ownership request for this venue." };
  }

  const { data, error } = await supabase
    .from("venue_claims")
    .insert({
      claimant_email: parsed.data.claimantEmail,
      claimant_id: user.id,
      claimant_name: parsed.data.claimantName,
      evidence_url: parsed.data.evidenceUrl || null,
      notes: parsed.data.notes,
      role_title: parsed.data.roleTitle,
      venue_id: venueId
    } as never)
    .select("id")
    .single();

  const claim = data as { id: string } | null;
  if (error || !claim) return { ok: false, message: `Ownership request could not be submitted: ${error?.message ?? "Unknown error"}` };

  await supabase.from("audit_logs").insert({
    action: "venue_claim_requested",
    actor_id: user.id,
    metadata: { claimantName: parsed.data.claimantName, roleTitle: parsed.data.roleTitle, venueId },
    target_id: claim.id,
    target_type: "venue_claim"
  } as never);

  revalidatePath(`/venues/${venueSlug}`);
  revalidatePath("/admin/venue-claims");
  revalidatePath("/admin/venues/review");
  return { ok: true, message: "Ownership request submitted. An admin will review it before linking you to the venue." };
}
