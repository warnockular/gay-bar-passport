"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/features/profile/actions";
import { profileSchema, type ProfileValues } from "@/schemas/profile";
import type { Profile } from "@/services/profiles";
import type { AuthActionResult } from "@/features/auth/actions";

type ProfileFormProps = {
  profile: Profile;
  email: string;
};

export function ProfileForm({ profile, email }: ProfileFormProps) {
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
    const formData = new FormData();

    formData.set("displayName", values.displayName);
    formData.set("homeCity", values.homeCity ?? "");

    if (avatarInput?.files?.[0]) {
      formData.set("avatar", avatarInput.files[0]);
    }

    startTransition(async () => {
      setResult(await updateProfile(formData));
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
