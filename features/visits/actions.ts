"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { visitSchema } from "@/schemas/visit";
import { awardVisitAchievements } from "@/services/visits";
import type { Tables } from "@/types/database";

export type VisitActionResult = {
  ok: boolean;
  message: string;
};

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop();
  return fromName && fromName.length <= 8 ? fromName.toLowerCase() : file.type.split("/").pop() ?? "jpg";
}

function buildStampCode(city: string, visitedOn: string) {
  return `${city.slice(0, 3).toUpperCase()}-${visitedOn.slice(0, 4)}`;
}

async function uploadVisitPhotos(userId: string, visitId: string, photos: File[]) {
  if (!photos.length) return { ok: true, message: "" };

  const supabase = await createSupabaseServerClient();
  const rows: Array<{ storage_path: string; user_id: string; visit_id: string }> = [];

  for (const [index, photo] of photos.entries()) {
    if (!photo.type.startsWith("image/")) {
      return { ok: false, message: "Visit photos must be image files." };
    }

    if (photo.size > 4 * 1024 * 1024) {
      return { ok: false, message: "Keep each visit photo under 4 MB." };
    }

    const storagePath = `${userId}/${visitId}/photo-${Date.now()}-${index}.${getFileExtension(photo)}`;
    const { error } = await supabase.storage.from("visit-photos").upload(storagePath, photo, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false
    });

    if (error) return { ok: false, message: error.message };

    rows.push({ storage_path: storagePath, user_id: userId, visit_id: visitId });
  }

  if (rows.length) {
    const { error } = await supabase.from("visit_photos").insert(rows as never);
    if (error) return { ok: false, message: error.message };
  }

  return { ok: true, message: "" };
}

export async function createVisit(venueId: string, venueSlug: string, formData: FormData): Promise<VisitActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is required to log visits." };
  }

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before logging a visit." };

  const parsed = visitSchema.safeParse({
    visitedOn: formData.get("visitedOn"),
    rating: formData.get("rating"),
    mood: formData.get("mood"),
    privateNotes: formData.get("privateNotes")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your visit details." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: venueData } = await supabase.from("venues").select("city, country").eq("id", venueId).single();
  const venue = venueData as Pick<Tables<"venues">, "city" | "country"> | null;
  const { data: visitData, error } = await supabase
    .from("visits")
    .insert({
      mood: parsed.data.mood || null,
      private_notes: parsed.data.privateNotes || null,
      rating: parsed.data.rating,
      user_id: user.id,
      venue_id: venueId,
      visited_on: parsed.data.visitedOn
    } as never)
    .select("id")
    .single();

  const visit = visitData as Pick<Tables<"visits">, "id"> | null;

  if (error || !visit) {
    return { ok: false, message: error?.message ?? "Visit could not be saved." };
  }

  if (venue) {
    await supabase.from("passport_stamps").insert({
      city: venue.city,
      country: venue.country,
      stamp_code: buildStampCode(venue.city, parsed.data.visitedOn),
      user_id: user.id,
      venue_id: venueId,
      visit_id: visit.id
    } as never);
  }

  const photos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoResult = await uploadVisitPhotos(user.id, visit.id, photos);
  if (!photoResult.ok) return photoResult;

  await awardVisitAchievements(user.id);

  revalidatePath("/passport");
  revalidatePath(`/venues/${venueSlug}`);
  redirect("/passport");
}

export async function updateVisit(visitId: string, formData: FormData): Promise<VisitActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is required to update visits." };
  }

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before editing a visit." };

  const parsed = visitSchema.safeParse({
    visitedOn: formData.get("visitedOn"),
    rating: formData.get("rating"),
    mood: formData.get("mood"),
    privateNotes: formData.get("privateNotes")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your visit details." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("visits")
    .update({
      mood: parsed.data.mood || null,
      private_notes: parsed.data.privateNotes || null,
      rating: parsed.data.rating,
      visited_on: parsed.data.visitedOn
    } as never)
    .eq("id", visitId)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: error.message };

  const photos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoResult = await uploadVisitPhotos(user.id, visitId, photos);
  if (!photoResult.ok) return photoResult;

  await awardVisitAchievements(user.id);

  revalidatePath("/passport");
  revalidatePath(`/visits/${visitId}/edit`);
  redirect("/passport");
}
