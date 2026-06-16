"use client";

import { MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useVenues } from "@/hooks/use-venues";
import { cn } from "@/lib/utils";
import { fallbackVenues } from "@/services/venues";

type Venue = (typeof fallbackVenues)[number];

function VenueListCard({ venue }: { venue: Venue }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(venue.image_url) && !imageFailed;

  return (
    <Card className="overflow-hidden bg-card/85">
      <div className={cn("grid gap-0", showImage && "sm:grid-cols-[180px_1fr]")}>
        {showImage ? (
          <div className="relative h-48 sm:h-full">
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={venue.image_url ?? ""} alt={`${venue.name} destination preview`} className="max-h-full max-w-full object-contain" onError={() => setImageFailed(true)} />
            </div>
          </div>
        ) : null}
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-semibold">{venue.name}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-rose" aria-hidden="true" />
                {venue.city}, {venue.country}
              </p>
            </div>
            <Badge>{venue.category}</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{venue.description}</p>
          {venue.is_lgbtq_owned ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-sage">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              LGBTQ+ owned marker prepared
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

export function VenueList() {
  const { data: venues = [], isLoading, error } = useVenues();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading venue collection...</p>;
  }

  if (error) {
    return (
      <Card className="bg-card/85 p-5">
        <p className="font-semibold text-destructive">Venue data could not be loaded.</p>
        <p className="mt-2 text-sm text-muted-foreground">Check your Supabase table policies and environment variables.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {venues.map((venue) => (
        <VenueListCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
