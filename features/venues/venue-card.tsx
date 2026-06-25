"use client";

import { VenueCard as PresentationVenueCard } from "@/features/venues/presentation";
import type { VenueWithTags } from "@/services/venues";

type VenueCardProps = {
  favoriteIds?: string[];
  isSignedIn?: boolean;
  venue: VenueWithTags;
};

export function VenueCard({ favoriteIds = [], isSignedIn = false, venue }: VenueCardProps) {
  return (
    <PresentationVenueCard
      favoriteIds={favoriteIds}
      isSignedIn={isSignedIn}
      showLogVisitAction
      venue={venue}
    />
  );
}
