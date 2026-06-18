"use client";

/* eslint-disable @next/next/no-img-element */

import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type VenueImagePreviewProps = {
  alt: string;
  className?: string;
  imageUrl?: string | null;
  mode?: "admin" | "public" | "submission";
};

export function VenueImagePreview({ alt, className, imageUrl, mode = "public" }: VenueImagePreviewProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(imageUrl) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  if (mode === "public" && !hasImage) return null;
  if (mode === "submission" && !imageUrl) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-muted/40", className)}>
      {hasImage ? (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-5">
          <img src={imageUrl ?? ""} alt={alt} className="max-h-full max-w-full object-contain" onError={() => setFailed(true)} />
        </div>
      ) : (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
          <ImageOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-foreground">{imageUrl ? "Image could not be loaded" : "No image provided"}</p>
          <p>
            {imageUrl
              ? mode === "submission"
                ? "We couldn't preview this image. You can try another image URL or submit without one."
                : "The saved URL may be invalid, blocked, or hotlink-protected. Replace it below."
              : mode === "admin"
                ? "Add an image URL to improve venue readiness."
                : "A venue image has not been added yet."}
          </p>
        </div>
      )}
    </div>
  );
}
