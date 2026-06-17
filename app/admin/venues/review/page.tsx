import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateVenueStatus, updateVenueVerification } from "@/features/admin/actions";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { venueCategoryLabel } from "@/lib/venue-categories";
import { listAdminVenueReviewQueue, type VenueQueueFilter, type VenueQueueSort } from "@/services/admin";
import type { Tables } from "@/types/database";

type AdminVenueReviewPageProps = {
  searchParams?: Promise<{ city?: string; filter?: string; sort?: string; updated?: string }>;
};

const filters: Array<{ label: string; value: VenueQueueFilter }> = [
  { label: "Pending Review", value: "pending_review" },
  { label: "Active", value: "active" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Archived", value: "archived" },
  { label: "Rejected", value: "rejected" },
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

function label(value: string) {
  return value
    .split("_")
    .map((part) => (part.toLowerCase() === "lgbtq" ? "LGBTQ" : part.slice(0, 1).toUpperCase() + part.slice(1)))
    .join(" ");
}

const verificationActions = [
  { label: "Mark Community Verified", value: "community_verified" },
  { label: "Mark Owner Verified", value: "owner_verified" },
  { label: "Mark Admin Verified", value: "admin_verified" },
  { label: "Mark Unverified", value: "unverified" }
] as const;

function moderationStatus(venue: Tables<"venues">) {
  if (venue.archived_at || venue.review_status === "archived") return "Archived";
  if (venue.review_status === "rejected") return "Rejected";
  if (venue.review_status === "needs_review" || venue.review_status === "hidden") return "Needs Review";
  if (venue.review_status === "pending_review") return "Pending Review";
  return "Active";
}

function sourceLabel(venue: Tables<"venues">) {
  if (venue.submission_status === "community_submitted") return "Community Submitted";
  if (venue.submission_status === "owner_submitted") return "Owner Submitted";
  if (venue.submission_status === "imported") return "Import";
  return "Admin Created";
}

function missingDataSummary(missingData: string[]) {
  if (!missingData.length) return "No tracked quality gaps.";
  const visible = missingData.slice(0, 4).map(label).join(", ");
  const remaining = missingData.length > 4 ? ` + ${missingData.length - 4} more` : "";
  return `${visible}${remaining}`;
}

export default async function AdminVenueReviewPage({ searchParams }: AdminVenueReviewPageProps) {
  const params = await searchParams;
  const filter = isVenueQueueFilter(params?.filter) ? params.filter : "pending_review";
  const sort = isVenueQueueSort(params?.sort) ? params.sort : "newest";
  const cityFilter = params?.city?.toLowerCase();
  const venues = (await listAdminVenueReviewQueue(filter, sort)).filter((venue) => cityFilter ? venue.city.toLowerCase() === cityFilter || venue.region?.toLowerCase() === cityFilter : true);
  const cityQuery = cityFilter ? `&city=${cityFilter}` : "";
  const feedbackPath = `/admin/venues/review?filter=${filter}&sort=${sort}${cityQuery}`;

  return (
    <div>
      <Badge>Venue Queue</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue moderation queue.</h1>
      {params?.updated === "verification" ? <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">Venue verification updated.</p> : null}
      {params?.updated === "review-status" ? <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">Venue review status updated.</p> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/admin/venues/review?filter=${filter}&sort=${sort}&city=montreal`} className={`rounded-md border border-border px-3 py-2 text-sm font-semibold ${cityFilter === "montreal" ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
          Montreal queue
        </Link>
        {cityFilter ? (
          <Link href={`/admin/venues/review?filter=${filter}&sort=${sort}`} className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            Clear city filter
          </Link>
        ) : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link key={item.value} href={`/admin/venues/review?filter=${item.value}&sort=${sort}${cityQuery}`} className={`rounded-md border border-border px-3 py-2 text-sm font-semibold ${filter === item.value ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {sorts.map((item) => (
          <Link key={item.value} href={`/admin/venues/review?filter=${filter}&sort=${item.value}${cityQuery}`} className={`rounded-md border border-border px-3 py-2 text-xs font-semibold ${sort === item.value ? "bg-muted text-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
            Sort: {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {venues.length ? (
          venues.map((venue) => (
            <Card key={venue.id} className="overflow-hidden bg-card/90">
              <div className="grid gap-0 lg:grid-cols-[11rem_1fr]">
                <div className="border-b border-border bg-background/60 p-4 lg:border-b-0 lg:border-r">
                  <VenueImagePreview imageUrl={venue.image_url} alt={`${venue.name} review image preview`} className="h-32 lg:h-full" mode="admin" />
                </div>
                <div className="grid gap-5 p-5 xl:grid-cols-[1fr_18rem]">
                  <div className="space-y-5">
                    <section>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Venue Summary</p>
                          <Link href={`/admin/venues/${venue.id}`} className="mt-2 block font-serif text-2xl font-semibold leading-tight hover:text-primary sm:text-3xl">
                            {venue.name}
                          </Link>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {[venue.neighborhood, venue.city, venue.region, venue.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                        <Badge>{venueCategoryLabel(venue.category)}</Badge>
                      </div>
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-md border border-border bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Source</p>
                          <p className="mt-1 font-semibold">{sourceLabel(venue)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Moderation Status</p>
                          <p className="mt-1 font-semibold">{moderationStatus(venue)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Verification Status</p>
                          <p className="mt-1 font-semibold">{label(venue.verification_status)}</p>
                        </div>
                        <div className="rounded-md border border-border bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Complete</p>
                          <p className="mt-1 font-semibold">{venue.completeness_score}/100</p>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-md border border-border bg-background/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quality / Missing Data</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge>{label(venue.readiness_status)}</Badge>
                        <Badge>{venue.verification_score}/100 trust score</Badge>
                        {venue.featured ? <Badge>Featured</Badge> : null}
                        {venue.claimed_by ? <Badge>Owner linked</Badge> : <Badge>Unclaimed</Badge>}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{missingDataSummary(venue.missing_data)}</p>
                    </section>
                  </div>

                  <section className="rounded-md border border-border bg-background/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Moderation Actions</p>
                    <div className="mt-4 grid gap-2">
                      <Link href={`/admin/venues/${venue.id}`} className="rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90">
                        Review Venue
                      </Link>
                      <Link href={`/admin/venues/${venue.id}`} className="rounded-md border border-border bg-card px-3 py-2 text-center text-sm font-semibold hover:bg-muted">
                        Edit Venue
                      </Link>
                      <form action={updateVenueVerification.bind(null, venue.id, "admin_verified", feedbackPath)}>
                        <button className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                          Mark Admin Verified
                        </button>
                      </form>
                      {moderationStatus(venue) !== "Active" ? (
                        <form action={updateVenueStatus.bind(null, venue.id, "active", feedbackPath)}>
                          <button className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                            Approve / Make Active
                          </button>
                        </form>
                      ) : null}
                      {moderationStatus(venue) !== "Needs Review" ? (
                        <form action={updateVenueStatus.bind(null, venue.id, "needs_review", feedbackPath)}>
                          <button className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                            Mark Needs Review
                          </button>
                        </form>
                      ) : null}
                      {moderationStatus(venue) !== "Pending Review" ? (
                        <form action={updateVenueStatus.bind(null, venue.id, "pending_review", feedbackPath)}>
                          <button className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                            Restore to Pending Review
                          </button>
                        </form>
                      ) : null}
                      {moderationStatus(venue) !== "Archived" ? (
                        <form action={updateVenueStatus.bind(null, venue.id, "archived", feedbackPath)}>
                          <button className="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                            Archive Venue
                          </button>
                        </form>
                      ) : null}
                      {moderationStatus(venue) !== "Rejected" ? (
                        <form action={updateVenueStatus.bind(null, venue.id, "rejected", feedbackPath)}>
                          <button className="w-full rounded-md border border-destructive/40 bg-card px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                            Reject Submission
                          </button>
                        </form>
                      ) : null}
                      <details className="rounded-md border border-border bg-card p-3">
                        <summary className="cursor-pointer text-sm font-semibold">More verification options</summary>
                        <div className="mt-3 grid gap-2">
                          {verificationActions.filter((action) => action.value !== "admin_verified").map((action) => (
                            <form key={action.value} action={updateVenueVerification.bind(null, venue.id, action.value, feedbackPath)}>
                              <button className="w-full rounded-md border border-border bg-background/70 px-3 py-2 text-left text-sm font-semibold hover:bg-muted" type="submit">
                                {action.label}
                              </button>
                            </form>
                          ))}
                        </div>
                      </details>
                    </div>
                  </section>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-card/90 p-6">
            <p className="font-semibold">No venues need review for this filter.</p>
            <p className="mt-2 text-sm text-muted-foreground">Try another queue filter, clear the city filter, or return to all venues.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
