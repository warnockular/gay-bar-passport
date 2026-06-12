"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { venueSubmissionSchema, type VenueSubmissionValues } from "@/schemas/venue-submission";

export type VenueSubmissionResult = {
  fieldErrors?: Partial<Record<keyof VenueSubmissionValues, string[]>>;
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
