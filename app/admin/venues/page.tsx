import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createModerationFlag, updateVenueStatus } from "@/features/admin/actions";
import { listAdminVenues } from "@/services/admin";

export default async function AdminVenuesPage() {
  const venues = await listAdminVenues();

  return (
    <div>
      <Badge>Venues</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue review.</h1>
      <div className="mt-8 space-y-4">
        {venues.map((venue) => (
          <Card key={venue.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/admin/venues/${venue.id}`} className="font-serif text-2xl font-semibold hover:text-primary">{venue.name}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{venue.city}, {venue.country} · {venue.category}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{venue.review_status}</Badge>
                  <Badge>{venue.is_published ? "published" : "hidden"}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["active", "hidden", "pending_review"] as const).map((status) => (
                  <form key={status} action={updateVenueStatus.bind(null, venue.id, status)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{status}</button>
                  </form>
                ))}
                <form action={createModerationFlag.bind(null, "venue", venue.id, "Venue flagged for review")}>
                  <button className="rounded-md border border-terracotta/50 bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Flag</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
