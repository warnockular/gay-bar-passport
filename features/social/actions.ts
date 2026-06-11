"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type NotificationInsert = {
  actor_id: string;
  comment_id?: string;
  journal_entry_id?: string;
  type: "new_comment" | "new_follower" | "new_like";
  user_id: string;
};

async function createNotification(notification: NotificationInsert) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("notifications").insert(notification as never);

  if (!error) {
    revalidatePath("/notifications");
  }
}

export async function toggleFollow(profileId: string) {
  if (!isSupabaseConfigured) return;
  const user = await requireUser();
  if (!user || user.id === profileId) return;

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("follows").select("follower_id").eq("follower_id", user.id).eq("following_id", profileId).maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profileId);
  } else {
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: profileId } as never);
    if (!error) {
      await createNotification({ actor_id: user.id, type: "new_follower", user_id: profileId });
    }
  }

  revalidatePath("/users");
  revalidatePath(`/users/${profileId}`);
  revalidatePath("/feed");
  revalidatePath("/notifications");
}

export async function toggleJournalLike(entryId: string) {
  if (!isSupabaseConfigured) return;
  const user = await requireUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();
  const { data: entry } = await supabase.from("journal_entries").select("id, user_id, is_private").eq("id", entryId).maybeSingle();
  const journalEntry = entry as Pick<Tables<"journal_entries">, "id" | "is_private" | "user_id"> | null;
  if (!journalEntry || journalEntry.is_private || journalEntry.user_id === user.id) return;

  const { data: existing } = await supabase.from("journal_likes").select("entry_id").eq("entry_id", entryId).eq("user_id", user.id).maybeSingle();
  if (existing) {
    await supabase.from("journal_likes").delete().eq("entry_id", entryId).eq("user_id", user.id);
  } else {
    const { error } = await supabase.from("journal_likes").insert({ entry_id: entryId, user_id: user.id } as never);
    if (!error) {
      await createNotification({ actor_id: user.id, journal_entry_id: entryId, type: "new_like", user_id: journalEntry.user_id });
    }
  }

  revalidatePath("/feed");
  revalidatePath(`/journal/${entryId}`);
  revalidatePath(`/users/${journalEntry.user_id}`);
}

export async function addJournalComment(entryId: string, formData: FormData) {
  if (!isSupabaseConfigured) return;
  const user = await requireUser();
  if (!user) return;

  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > 1000) return;

  const supabase = await createSupabaseServerClient();
  const { data: entry } = await supabase.from("journal_entries").select("id, user_id, is_private").eq("id", entryId).maybeSingle();
  const journalEntry = entry as Pick<Tables<"journal_entries">, "id" | "is_private" | "user_id"> | null;
  if (!journalEntry || journalEntry.is_private) return;

  const { data: comment, error } = await supabase.from("journal_comments").insert({ body, entry_id: entryId, user_id: user.id } as never).select("id").single();
  const savedComment = comment as Pick<Tables<"journal_comments">, "id"> | null;

  if (!error && savedComment && journalEntry.user_id !== user.id) {
    await createNotification({ actor_id: user.id, comment_id: savedComment.id, journal_entry_id: entryId, type: "new_comment", user_id: journalEntry.user_id });
  }

  revalidatePath("/feed");
  revalidatePath(`/journal/${entryId}`);
  revalidatePath(`/users/${journalEntry.user_id}`);
}

export async function markNotificationsRead() {
  if (!isSupabaseConfigured) return;
  const user = await requireUser();
  if (!user) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() } as never).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}
