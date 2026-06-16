"use client";

import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { cn } from "@/lib/utils";
import { venueCategoryLabel } from "@/lib/venue-categories";
import type { VenueWithTags } from "@/services/venues";

type VenueCardProps = {
  favoriteIds?: string[];
  isSignedIn?: boolean;
  venue: VenueWithTags;
};

export function VenueCard({ favoriteIds = [], isSignedIn = false, venue }: VenueCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(venue.image_url) && !imageFailed;

  return (
    <Card className="overflow-hidden bg-card/90">
      <div className={cn("grid gap-0", showImage && "md:grid-cols-[240px_1fr]")}>
        {showImage ? (
          <Link href={`/venues/${venue.slug}`} className="relative block h-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-64 md:h-full">
            <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={venue.image_url ?? ""} alt={`${venue.name} venue preview`} className="max-h-full max-w-full object-contain" onError={() => setImageFailed(true)} />
            </span>
          </Link>
        ) : null}
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <Link href={`/venues/${venue.slug}`} className="font-serif text-2xl font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-3xl">
                {venue.name}
              </Link>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-rose" aria-hidden="true" />
                <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>
                  {venue.city}
                </Link>
                <span>,</span>
                <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>
                  {venue.country}
                </Link>
              </p>
            </div>
            <FavoriteButton venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={isSignedIn} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{venueCategoryLabel(venue.category)}</Badge>
            {venue.tags.map((tag) => (
              <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
                <Badge className="normal-case tracking-normal">{tag.name}</Badge>
              </Link>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{venue.description}</p>
          {venue.is_lgbtq_owned ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-sage">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              LGBTQ+ owned
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
