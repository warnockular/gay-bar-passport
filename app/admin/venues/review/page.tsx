import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateVenueVerification } from "@/features/admin/actions";
import { listAdminVenueReviewQueue, type VenueQueueFilter, type VenueQueueSort } from "@/services/admin";

type AdminVenueReviewPageProps = {
  searchParams?: Promise<{ filter?: string; sort?: string }>;
};

const filters: Array<{ label: string; value: VenueQueueFilter }> = [
  { label: "Unverified", value: "unverified" },
  { label: "Community submitted", value: "community_submitted" },
  { label: "Owner submitted", value: "owner_submitted" },
  { label: "Imported awaiting review", value: "imported_review" },
  { label: "Ownership claims", value: "claimed_review" },
  { label: "All venues", value: "all" }
];

const sorts: Array<{ label: string; value: VenueQueueSort }> = [
  { label: "Newest", value: "newest" },
  { label: "Lowest score", value: "score" },
  { label: "Name", value: "name" }
];

function isVenueQueueFilter(value?: string): value is VenueQueueFilter {
  return filters.some((filter) => filter.value === value);
}

function isVenueQueueSort(value?: string): value is VenueQueueSort {
  return sorts.some((sort) => sort.value === value);
}

export default async function AdminVenueReviewPage({ searchParams }: AdminVenueReviewPageProps) {
  const params = await searchParams;
  const filter = isVenueQueueFilter(params?.filter) ? params.filter : "unverified";
  const sort = isVenueQueueSort(params?.sort) ? params.sort : "newest";
  const venues = await listAdminVenueReviewQueue(filter, sort);

  return (
    <div>
      <Badge>Venue Queue</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue moderation queue.</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link key={item.value} href={`/admin/venues/review?filter=${item.value}&sort=${sort}`} className={`rounded-md border border-border px-3 py-2 text-sm font-semibold ${filter === item.value ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sorts.map((item) => (
          <Link key={item.value} href={`/admin/venues/review?filter=${filter}&sort=${item.value}`} className={`rounded-md border border-border px-3 py-2 text-xs font-semibold ${sort === item.value ? "bg-muted text-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
            Sort: {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {venues.length ? (
          venues.map((venue) => (
            <Card key={venue.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/admin/venues/${venue.id}`} className="font-serif text-2xl font-semibold hover:text-primary">
                    {venue.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{venue.city}, {venue.country} · {venue.category}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{venue.verification_status}</Badge>
                    <Badge>{venue.verification_score}/100</Badge>
                    <Badge>{venue.submission_status}</Badge>
                    <Badge>{venue.identity_classification}</Badge>
                    <Badge>{venue.review_status}</Badge>
                    <Badge>{venue.readiness_status}</Badge>
                    <Badge>{venue.completeness_score}/100 complete</Badge>
                    {venue.featured ? <Badge>featured</Badge> : null}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Source: {venue.source ? `${venue.source}${venue.source_id ? ` · ${venue.source_id}` : ""}` : "manual"} · Claim: {venue.claimed_by ? "claimed" : "unclaimed"}
                  </p>
                  {venue.missing_data.length ? <p className="mt-2 text-xs text-muted-foreground">Missing: {venue.missing_data.join(", ")}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["community_verified", "owner_verified", "admin_verified", "unverified"] as const).map((status) => (
                    <form key={status} action={updateVenueVerification.bind(null, venue.id, status, undefined)}>
                      <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                        {status}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No venues match this queue view.</Card>
        )}
      </div>
    </div>
  );
}
