"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/schemas/profile";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActionResult } from "@/features/auth/actions";
import type { Database } from "@/types/database";

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 8) {
    return fromName.toLowerCase();
  }

  return file.type.split("/").pop() ?? "jpg";
}

export async function updateProfile(formData: FormData): Promise<AuthActionResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to save profiles." };
  }

  const user = await requireUser();

  if (!user) {
    return { ok: false, message: "Sign in before editing your profile." };
  }

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    homeCity: formData.get("homeCity")
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your profile details." };
  }

  const supabase = await createSupabaseServerClient();
  const avatar = formData.get("avatar");
  let avatarUrl: string | undefined;

  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/")) {
      return { ok: false, message: "Upload an image file for your avatar." };
    }

    if (avatar.size > 2 * 1024 * 1024) {
      return { ok: false, message: "Keep avatars under 2 MB." };
    }

    const filePath = `${user.id}/avatar-${Date.now()}.${getFileExtension(avatar)}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: true
    });

    if (uploadError) {
      return { ok: false, message: uploadError.message };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    avatarUrl = data.publicUrl;
  }

  const profileInsert: ProfileInsert = {
    id: user.id,
    display_name: parsed.data.displayName,
    home_city: parsed.data.homeCity || null,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {})
  };

  const { error } = await supabase.from("profiles").upsert(profileInsert as never, { onConflict: "id" });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { ok: true, message: "Profile saved. Your passport identity is up to date." };
}
