"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileSchema, type ProfileValues } from "@/schemas/profile";
import type { Profile } from "@/services/profiles";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/database";

type AuthActionResult = {
  ok: boolean;
  message: string;
};

type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

type ProfileFormProps = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const [avatarName, setAvatarName] = useState<string>("");
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile.display_name ?? "",
      homeCity: profile.home_city ?? ""
    }
  });

  function onSubmit(values: ProfileValues) {
    const avatarInput = document.getElementById("avatar") as HTMLInputElement | null;

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setResult({ ok: false, message: "Supabase is not configured yet. Add your environment variables to save profiles." });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setResult({ ok: false, message: "Sign in before editing your profile." });
        return;
      }

      const avatar = avatarInput?.files?.[0];
      let avatarUrl: string | undefined;

      if (avatar) {
        if (!avatar.type.startsWith("image/")) {
          setResult({ ok: false, message: "Upload an image file for your avatar." });
          return;
        }

        if (avatar.size > 2 * 1024 * 1024) {
          setResult({ ok: false, message: "Keep avatars under 2 MB." });
          return;
        }

        const extension = avatar.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const filePath = `${user.id}/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatar, {
          cacheControl: "3600",
          contentType: avatar.type,
          upsert: true
        });

        if (uploadError) {
          setResult({ ok: false, message: uploadError.message });
          return;
        }

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      }

      const profileInsert: ProfileInsert = {
        id: user.id,
        display_name: values.displayName,
        home_city: values.homeCity || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {})
      };

      const { error } = await supabase.from("profiles").upsert(profileInsert as never, { onConflict: "id" });

      if (error) {
        setResult({ ok: false, message: error.message });
        return;
      }

      setResult({ ok: true, message: "Profile saved. Your passport identity is up to date." });
      router.refresh();
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 md:grid-cols-[11rem_1fr]">
        <div className="space-y-3">
          <div className="grid aspect-square w-40 place-items-center overflow-hidden rounded-md border border-border bg-muted">
            {profile.avatar_url ? (
              <img className="h-full w-full object-cover" src={profile.avatar_url} alt="" />
            ) : (
              <span className="font-serif text-5xl text-muted-foreground">{(profile.display_name ?? email).slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatar" className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
              <ImageUp className="h-4 w-4" aria-hidden="true" />
              Upload avatar
            </Label>
            <Input
              id="avatar"
              name="avatar"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => setAvatarName(event.target.files?.[0]?.name ?? "")}
            />
            {avatarName ? <p className="text-xs text-muted-foreground">{avatarName}</p> : null}
          </div>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" placeholder="Avery Atlas" {...register("displayName")} />
            {errors.displayName ? <p className="text-sm text-destructive">{errors.displayName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="homeCity">Home city</Label>
            <Input id="homeCity" placeholder="Lisbon, Portugal" {...register("homeCity")} />
            {errors.homeCity ? <p className="text-sm text-destructive">{errors.homeCity.message}</p> : null}
          </div>
          <div className="rounded-md border border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
            Account email: <span className="font-medium text-foreground">{email}</span>
          </div>
        </div>
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p> : null}
      <Button type="submit" disabled={isPending}>
        <Save className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
