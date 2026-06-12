import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createBulkOperationDraft, createModerationFlag, updateVenueStatus } from "@/features/admin/actions";
import { listAdminVenues, listBulkOperationDrafts } from "@/services/admin";

export default async function AdminVenuesPage() {
  const [venues, bulkDrafts] = await Promise.all([listAdminVenues(), listBulkOperationDrafts()]);

  return (
    <div>
      <Badge>Venues</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue review.</h1>
      <Link href="/admin/venues/review" className="mt-4 inline-block rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-primary hover:bg-muted">
        Open venue moderation queue
      </Link>
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
                  <Badge>{venue.verification_status}</Badge>
                  <Badge>{venue.submission_status}</Badge>
                  <Badge>{venue.identity_classification}</Badge>
                  <Badge>{venue.readiness_status}</Badge>
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
