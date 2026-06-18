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

type PreviewStatus = "idle" | "loading" | "loaded" | "failed";

export function VenueImagePreview({ alt, className, imageUrl, mode = "public" }: VenueImagePreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>(imageUrl ? "loading" : "idle");
  const hasImage = Boolean(imageUrl) && status !== "failed";

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "idle");
  }, [imageUrl]);

  if (mode === "public" && !hasImage) return null;
  if (mode === "submission" && !imageUrl) return null;

  const showSubmissionMessage = mode === "submission" && status !== "loaded";

  return (
    <div className={cn("relative overflow-hidden rounded-md border border-border bg-muted/40", className)}>
      {hasImage && !showSubmissionMessage ? (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-5">
          <img
            key={imageUrl}
            src={imageUrl ?? ""}
            alt={alt}
            className="max-h-full max-w-full object-contain"
            onError={() => setStatus("failed")}
            onLoad={() => setStatus("loaded")}
          />
        </div>
      ) : showSubmissionMessage && status === "loading" ? (
        <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Checking image preview...</p>
          <img
            key={imageUrl}
            src={imageUrl ?? undefined}
            alt=""
            aria-hidden="true"
            className="sr-only"
            onError={() => setStatus("failed")}
            onLoad={() => setStatus("loaded")}
          />
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
