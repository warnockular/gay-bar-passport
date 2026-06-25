"use client";

import { Card } from "@/components/ui/card";
import { VenueCard } from "@/features/venues/presentation";
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
        <VenueCard key={venue.id} venue={{ ...venue, tags: [] }} showFavorite={false} showWebsiteAction={false} />
      ))}
    </div>
  );
}
