"use client";

import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useVisits } from "@/hooks/use-visits";
import { isSupabaseConfigured } from "@/lib/env";

export function VisitPreview() {
  const { data: visits = [], isLoading, error } = useVisits();

  if (!isSupabaseConfigured) {
    return (
      <Card className="bg-card/85 p-5">
        <p className="font-semibold">Visit history is ready for Supabase.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add environment variables and run the Phase 2 migration to load authenticated visits here.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading visit history...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">Visit history could not be loaded.</p>;
  }

  if (visits.length === 0) {
    return (
      <Card className="bg-card/85 p-5">
        <p className="font-semibold">No visits logged yet.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The query is wired. Phase 3 can add the form for logging a first venue visit.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {visits.slice(0, 3).map((visit) => (
        <Card key={visit.id} className="bg-card/85 p-5">
          <p className="font-serif text-2xl font-semibold">{visit.venues?.name ?? "Venue visit"}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
            {visit.visited_on}
          </p>
        </Card>
      ))}
    </div>
  );
}
