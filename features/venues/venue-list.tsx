"use client";

import Image from "next/image";
import { MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useVenues } from "@/hooks/use-venues";

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
        <Card key={venue.id} className="overflow-hidden bg-card/85">
          <div className="grid gap-0 sm:grid-cols-[180px_1fr]">
            {venue.image_url ? (
              <div className="relative h-48 sm:h-full">
                <Image src={venue.image_url} alt={`${venue.name} destination preview`} fill className="object-cover" />
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
      ))}
    </div>
  );
}
