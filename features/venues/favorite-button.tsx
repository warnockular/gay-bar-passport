"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FavoriteButtonProps = {
  buttonClassName?: string;
  initialIsFavorite: boolean;
  isSignedIn: boolean;
  venueId: string;
};

export function FavoriteButton({ buttonClassName, initialIsFavorite, isSignedIn, venueId }: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleFavorite() {
    setMessage(null);

    if (!isSignedIn) {
      router.push(`/auth/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setMessage("Favorites are temporarily unavailable.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/auth/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (isFavorite) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("venue_id", venueId);

        if (error) {
          setMessage("Could not update this favorite. Please try again.");
          return;
        }

        setIsFavorite(false);
        router.refresh();
        return;
      }

      const { error } = await supabase.from("favorites").insert({ user_id: user.id, venue_id: venueId } as never);

      if (error) {
        setMessage("Could not save this favorite. Please try again.");
        return;
      }

      setIsFavorite(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button className={buttonClassName} type="button" variant={isFavorite ? "default" : "outline"} onClick={toggleFavorite} disabled={isPending}>
        <Heart className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} aria-hidden="true" />
        {isFavorite ? "Favorited" : "Favorite"}
      </Button>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
    </div>
  );
}
