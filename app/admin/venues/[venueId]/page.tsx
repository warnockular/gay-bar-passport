import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { updateVenueMetadata, updateVenueStatus } from "@/features/admin/actions";
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
        </Card>
      </div>
    </div>
  );
}
