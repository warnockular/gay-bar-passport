"use client";

/* eslint-disable @next/next/no-img-element */

import { ImageOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type VenueImagePreviewProps = {
  alt: string;
  className?: string;
  imageUrl?: string | null;
  mode?: "admin" | "public";
};

export function VenueImagePreview({ alt, className, imageUrl, mode = "public" }: VenueImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(imageUrl) && !failed;

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-background/70", className)}>
      {hasImage ? (
        <img src={imageUrl ?? ""} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
          <ImageOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground">{imageUrl ? "Image could not be loaded" : "No image provided"}</p>
          <p>{imageUrl ? "The saved URL may be invalid, blocked, or hotlink-protected. Replace it below." : mode === "admin" ? "Add an image URL to improve venue readiness." : "A venue image has not been added yet."}</p>
        </div>
      )}
    </div>
  );
}
