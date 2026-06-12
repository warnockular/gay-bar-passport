import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateVenueFeatured, updateVenueIdentityClassification, updateVenueMetadata, updateVenueSource, updateVenueStatus, updateVenueVerification } from "@/features/admin/actions";
import { getAdminVenue } from "@/services/admin";

type AdminVenuePageProps = {
  params: Promise<{ venueId: string }>;
};

export default async function AdminVenuePage({ params }: AdminVenuePageProps) {
  const { venueId } = await params;
  const venue = await getAdminVenue(venueId);
  if (!venue) notFound();

  return (
    <div>
      <Badge>Venue</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">{venue.name}</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Metadata</h2>
          <form action={updateVenueMetadata.bind(null, venue.id)} className="mt-5 grid gap-4">
            <input name="name" defaultValue={venue.name} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" />
            <select name="category" defaultValue={venue.category} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              {["bar", "club", "lounge", "cafe", "performance", "community"].map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input name="neighborhood" defaultValue={venue.neighborhood ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Neighborhood" />
            <input name="address" defaultValue={venue.address ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Address" />
            <input name="websiteUrl" defaultValue={venue.website_url ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Website" />
            <input name="openingHours" defaultValue={venue.opening_hours ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Hours" />
            <textarea name="description" defaultValue={venue.description ?? ""} className="min-h-32 rounded-md border border-input bg-background/80 px-3 py-2 text-sm" />
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Save metadata</button>
          </form>
        </Card>
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Review status</h2>
          <p className="mt-3 text-sm text-muted-foreground">Current: {venue.review_status}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {(["active", "hidden", "pending_review"] as const).map((status) => (
              <form key={status} action={updateVenueStatus.bind(null, venue.id, status)}>
                <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{status}</button>
              </form>
            ))}
          </div>
        </Card>
        <Card className="bg-card/90 p-6 lg:col-start-2">
          <h2 className="font-serif text-3xl font-semibold">Data foundation</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Completeness</dt>
              <dd className="text-muted-foreground">{venue.completeness_score}/100 · {venue.readiness_status}</dd>
            </div>
            <div>
              <dt className="font-semibold">Missing data</dt>
              <dd className="text-muted-foreground">{venue.missing_data.length ? venue.missing_data.join(", ") : "No tracked gaps"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Featured</dt>
              <dd className="text-muted-foreground">{venue.featured ? `Featured ${venue.featured_at ?? ""}` : "Not featured"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Verification</dt>
              <dd className="text-muted-foreground">{venue.verification_status} · score {venue.verification_score}/100</dd>
            </div>
            <div>
              <dt className="font-semibold">Identity</dt>
              <dd className="text-muted-foreground">{venue.identity_classification}</dd>
            </div>
            <div>
              <dt className="font-semibold">Submission</dt>
              <dd className="text-muted-foreground">{venue.submission_status}</dd>
            </div>
            <div>
              <dt className="font-semibold">Source</dt>
              <dd className="text-muted-foreground">{venue.source ? `${venue.source}${venue.source_id ? ` · ${venue.source_id}` : ""}` : "manual"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Claim</dt>
              <dd className="text-muted-foreground">{venue.claimed_by ? `Claimed ${venue.claimed_at ?? ""}` : "Unclaimed"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Review</dt>
              <dd className="text-muted-foreground">{venue.reviewed_by ? `Reviewed ${venue.reviewed_at ?? ""}` : "Not reviewed in Phase 11B"}</dd>
            </div>
          </dl>
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-semibold">Feature controls</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={updateVenueFeatured.bind(null, venue.id, true)}>
                  <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Feature venue</button>
                </form>
                <form action={updateVenueFeatured.bind(null, venue.id, false)}>
                  <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Unfeature venue</button>
                </form>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Verification actions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["community_verified", "owner_verified", "admin_verified", "unverified"] as const).map((status) => (
                  <form key={status} action={updateVenueVerification.bind(null, venue.id, status)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                      {status}
                    </button>
                  </form>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Identity classification</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["lgbtq_venue", "lgbtq_friendly", "historic_site", "community_recommended"] as const).map((classification) => (
                  <form key={classification} action={updateVenueIdentityClassification.bind(null, venue.id, classification)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                      {classification}
                    </button>
                  </form>
                ))}
              </div>
            </div>
            <form action={updateVenueSource.bind(null, venue.id)} className="space-y-3">
              <h3 className="font-semibold">Source management</h3>
              <input name="source" defaultValue={venue.source ?? ""} className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Source, e.g. manual_import" />
              <input name="sourceId" defaultValue={venue.source_id ?? ""} className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Source ID" />
              <select name="submissionStatus" defaultValue={venue.submission_status} className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm">
                {["imported", "community_submitted", "owner_submitted", "admin_created"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Save source state</button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
