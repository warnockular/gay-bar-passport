"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { journalSchema } from "@/schemas/journal";
import type { Tables } from "@/types/database";

export type JournalActionResult = {
  ok: boolean;
  message: string;
};

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop();
  return fromName && fromName.length <= 8 ? fromName.toLowerCase() : file.type.split("/").pop() ?? "jpg";
}

async function uploadJournalPhotos(userId: string, entryId: string, photos: File[]): Promise<JournalActionResult> {
  if (!photos.length) return { ok: true, message: "" };

  const supabase = await createSupabaseServerClient();
  const rows: Array<{ entry_id: string; storage_path: string; user_id: string }> = [];

  for (const [index, photo] of photos.entries()) {
    if (!photo.type.startsWith("image/")) return { ok: false, message: "Journal photos must be image files." };
    if (photo.size > 4 * 1024 * 1024) return { ok: false, message: "Keep each journal photo under 4 MB." };

    const storagePath = `${userId}/${entryId}/photo-${Date.now()}-${index}.${getFileExtension(photo)}`;
    const { error } = await supabase.storage.from("journal-photos").upload(storagePath, photo, {
      cacheControl: "3600",
      contentType: photo.type,
      upsert: false
    });

    if (error) return { ok: false, message: error.message };
    rows.push({ entry_id: entryId, storage_path: storagePath, user_id: userId });
  }

  if (rows.length) {
    const { error } = await supabase.from("journal_photos").insert(rows as never);
    if (error) return { ok: false, message: error.message };
  }

  return { ok: true, message: "" };
}

function parseJournalForm(formData: FormData) {
  return journalSchema.safeParse({
    body: formData.get("body"),
    city: formData.get("city"),
    citySlug: formData.get("citySlug"),
    country: formData.get("country"),
    countrySlug: formData.get("countrySlug"),
    entryDate: formData.get("entryDate"),
    favoriteId: formData.get("favoriteId"),
    title: formData.get("title"),
    venueId: formData.get("venueId"),
    visitId: formData.get("visitId")
  });
}

function entryPayload(userId: string, data: ReturnType<typeof journalSchema.parse>) {
  return {
    body: data.body,
    city: data.city,
    city_slug: data.citySlug,
    country: data.country,
    country_slug: data.countrySlug,
    entry_date: data.entryDate,
    favorite_id: data.favoriteId || null,
    is_private: true,
    title: data.title,
    user_id: userId,
    venue_id: data.venueId || null,
    visit_id: data.visitId || null
  };
}

export async function createJournalEntry(formData: FormData): Promise<JournalActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is required to save journal entries." };

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before writing a journal entry." };

  const parsed = parseJournalForm(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your journal entry." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("journal_entries").insert(entryPayload(user.id, parsed.data) as never).select("id").single();
  const entry = data as Pick<Tables<"journal_entries">, "id"> | null;

  if (error || !entry) return { ok: false, message: error?.message ?? "Journal entry could not be saved." };

  const photos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoResult = await uploadJournalPhotos(user.id, entry.id, photos);
  if (!photoResult.ok) return photoResult;

  revalidatePath("/journal");
  redirect(`/journal/${entry.id}`);
}

export async function updateJournalEntry(entryId: string, formData: FormData): Promise<JournalActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is required to update journal entries." };

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before editing a journal entry." };

  const parsed = parseJournalForm(formData);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your journal entry." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("journal_entries").update(entryPayload(user.id, parsed.data) as never).eq("id", entryId).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  const photos = formData.getAll("photos").filter((item): item is File => item instanceof File && item.size > 0);
  const photoResult = await uploadJournalPhotos(user.id, entryId, photos);
  if (!photoResult.ok) return photoResult;

  revalidatePath("/journal");
  revalidatePath(`/journal/${entryId}`);
  redirect(`/journal/${entryId}`);
}

export async function deleteJournalEntry(entryId: string): Promise<JournalActionResult> {
  if (!isSupabaseConfigured) return { ok: false, message: "Supabase is required to delete journal entries." };

  const user = await requireUser();
  if (!user) return { ok: false, message: "Sign in before deleting a journal entry." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", entryId).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/journal");
  redirect("/journal");
}
