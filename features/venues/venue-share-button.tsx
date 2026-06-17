"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type VenueShareButtonProps = {
  path: string;
  title: string;
};

export function VenueShareButton({ path, title }: VenueShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function shareVenue() {
    const url = `${window.location.origin}${path}`;
    setCopied(false);

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // Fall back to copying when native share is dismissed or unavailable.
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-2">
      <Button className="w-full" type="button" variant="outline" onClick={shareVenue}>
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
        Share Venue
      </Button>
      {copied ? <p className="text-xs font-semibold text-sage" role="status">Venue link copied.</p> : null}
    </div>
  );
}
