import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createBulkOperationDraft, createModerationFlag, updateVenueStatus } from "@/features/admin/actions";
import { listAdminVenues, listBulkOperationDrafts } from "@/services/admin";

type AdminVenuesPageProps = {
  searchParams?: Promise<{ city?: string }>;
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => (part.toLowerCase() === "lgbtq" ? "LGBTQ" : part.slice(0, 1).toUpperCase() + part.slice(1)))
    .join(" ");
}

export default async function AdminVenuesPage({ searchParams }: AdminVenuesPageProps) {
  const params = await searchParams;
  const cityFilter = params?.city?.toLowerCase();
  const [venues, bulkDrafts] = await Promise.all([listAdminVenues(), listBulkOperationDrafts()]);
  const visibleVenues = cityFilter ? venues.filter((venue) => venue.city.toLowerCase() === cityFilter || venue.region?.toLowerCase() === cityFilter) : venues;

  return (
    <div>
      <Badge>Venues</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue review.</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/venues/review" className="inline-block rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">
          Open venue moderation queue
        </Link>
        <Link href="/admin/venues?city=montreal" className="inline-block rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">
          Montreal venues
        </Link>
        {cityFilter ? (
          <Link href="/admin/venues" className="inline-block rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">
            Clear city filter
          </Link>
        ) : null}
      </div>
      <Card className="mt-6 bg-card/90 p-5">
        <h2 className="font-serif text-2xl font-semibold">Bulk operations foundation</h2>
        <p className="mt-2 text-sm text-muted-foreground">Draft placeholders only. No bulk changes run in Phase 11E.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["bulk_verification", "bulk_classification", "bulk_feature"] as const).map((operation) => (
            <form key={operation} action={createBulkOperationDraft.bind(null, operation)}>
              <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{operation}</button>
            </form>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{bulkDrafts.length} draft placeholder(s) recorded.</p>
      </Card>
      {cityFilter ? <p className="mt-5 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage">Showing venues matching {cityFilter}.</p> : null}
      <div className="mt-8 space-y-4">
        {visibleVenues.map((venue) => (
          <Card key={venue.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Link href={`/admin/venues/${venue.id}`} className="font-serif text-2xl font-semibold hover:text-primary">{venue.name}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{venue.city}, {venue.country} · {venue.category}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{label(venue.review_status)}</Badge>
                  <Badge>{venue.is_published ? "published" : "hidden"}</Badge>
                  <Badge>{label(venue.verification_status)}</Badge>
                  <Badge>{label(venue.submission_status)}</Badge>
                  <Badge>{label(venue.identity_classification)}</Badge>
                  <Badge>{label(venue.readiness_status)}</Badge>
                  <Badge>{venue.completeness_score}/100 complete</Badge>
                  {venue.featured ? <Badge>featured</Badge> : null}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Source: {venue.source ? `${venue.source}${venue.source_id ? ` · ${venue.source_id}` : ""}` : "manual"}
                </p>
                {venue.missing_data.length ? <p className="mt-2 text-xs text-muted-foreground">Missing: {venue.missing_data.join(", ")}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["active", "hidden", "pending_review"] as const).map((status) => (
                  <form key={status} action={updateVenueStatus.bind(null, venue.id, status, undefined)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Set {label(status)}</button>
                  </form>
                ))}
                <form action={createModerationFlag.bind(null, "venue", venue.id, "Venue flagged for review")}>
                  <button className="rounded-md border border-terracotta/50 bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Flag</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
        {!visibleVenues.length ? <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No venues match this city filter.</Card> : null}
      </div>
    </div>
  );
}
