import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { approveStagedVenueAsNew, archiveStagedVenueCandidate, rejectStagedVenueCandidate } from "@/features/admin/actions";
import { venueCategoryLabel } from "@/lib/venue-categories";
import { getStagedVenue } from "@/services/admin";

type StagedCandidatePageProps = {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textFrom(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "Not provided";
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/70 p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-80 overflow-auto rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function feedbackMessage(updated?: string) {
  if (updated === "approved") return "Candidate approved as a new pending venue.";
  if (updated === "rejected") return "Candidate rejected.";
  if (updated === "archived") return "Candidate archived.";
  return null;
}

export default async function StagedCandidatePage({ params, searchParams }: StagedCandidatePageProps) {
  const { candidateId } = await params;
  const query = (await searchParams) ?? {};
  const candidate = await getStagedVenue(candidateId);
  if (!candidate) notFound();

  const raw = asObject(candidate.raw_data);
  const metadata = asObject(candidate.source_metadata);
  const address = asObject(candidate.address_components);
  const feedback = feedbackMessage(query.updated);
  const category = candidate.suggested_category ? venueCategoryLabel(candidate.suggested_category) : textFrom(raw.category);
  const canReview = candidate.approval_status !== "approved";

  return (
    <div>
      <Badge>Imported Candidate</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">{textFrom(candidate.name, raw.name)}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Review this staged import candidate before creating a real venue record. Approval creates a pending, unpublished imported venue.
      </p>

      {feedback ? (
        <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">{feedback}</p>
      ) : null}
      {query.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          Action failed: {query.error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-3xl font-semibold">Candidate Details</h2>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="Name" value={textFrom(candidate.name, raw.name)} />
              <Field label="Category" value={category} />
              <Field label="Address" value={textFrom(address.address, raw.address, metadata.address)} />
              <Field label="Neighborhood" value={textFrom(address.neighborhood, raw.neighborhood, metadata.neighborhood)} />
              <Field label="City" value={textFrom(candidate.city, raw.city, address.city)} />
              <Field label="Region" value={textFrom(address.region, raw.region, metadata.region)} />
              <Field label="Country" value={textFrom(candidate.country, raw.country, address.country)} />
              <Field label="Postal code" value={textFrom(candidate.postal_code, address.postal_code, raw.postal_code)} />
              <Field label="Coordinates" value={candidate.latitude !== null && candidate.longitude !== null ? `${candidate.latitude}, ${candidate.longitude}` : "Not provided"} />
              <Field label="Website" value={textFrom(raw.website_url, metadata.website_url)} />
              <Field label="Phone" value={textFrom(candidate.phone, raw.phone)} />
              <Field label="Image URL" value={textFrom(raw.image_url, metadata.image_url)} />
              <Field label="Opening hours" value={textFrom(raw.opening_hours, metadata.opening_hours)} />
              <Field label="Description" value={textFrom(raw.description, metadata.description, candidate.review_notes)} />
              <Field label="Suggested tags" value={candidate.suggested_tags.length ? candidate.suggested_tags.join(", ") : "Not provided"} />
              <Field label="Confidence score" value={candidate.confidence_score !== null ? `${candidate.confidence_score}/100` : "Not provided"} />
            </dl>
          </Card>

          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-3xl font-semibold">Source</h2>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="Source" value={candidate.source} />
              <Field label="Source ID" value={candidate.source_id ?? "Not provided"} />
              <Field label="Source URL" value={candidate.source_url ? <a className="text-primary hover:underline" href={candidate.source_url} target="_blank" rel="noreferrer">{candidate.source_url}</a> : "Not provided"} />
              <Field label="Last seen" value={candidate.last_seen_at ? new Date(candidate.last_seen_at).toLocaleString() : "Not provided"} />
            </dl>
          </Card>

          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-3xl font-semibold">Raw JSON Payload</h2>
            <JsonPreview value={candidate.raw_data} />
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">Staging Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold">Batch</dt><dd className="text-muted-foreground">{candidate.importBatch ? <Link className="text-primary hover:underline" href={`/admin/imports/${candidate.importBatch.id}`}>{candidate.importBatch.source_name}</Link> : "Unknown"}</dd></div>
              <div><dt className="font-semibold">Created</dt><dd className="text-muted-foreground">{new Date(candidate.created_at).toLocaleString()}</dd></div>
              <div><dt className="font-semibold">Approval status</dt><dd className="text-muted-foreground">{candidate.approval_status}</dd></div>
              <div><dt className="font-semibold">Duplicate status</dt><dd className="text-muted-foreground">{candidate.duplicate_review_status}</dd></div>
              <div><dt className="font-semibold">Notes</dt><dd className="text-muted-foreground">{candidate.review_notes ?? "None"}</dd></div>
            </dl>
            {candidate.approvedVenue ? (
              <Link className="mt-4 block rounded-md border border-sage/30 bg-sage/10 px-3 py-2 text-sm font-semibold text-sage hover:bg-sage/15" href={`/admin/venues/${candidate.approvedVenue.id}`}>
                Approved venue: {candidate.approvedVenue.name}
              </Link>
            ) : null}
            {candidate.matchedVenue ? (
              <Link className="mt-3 block rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" href={`/admin/venues/${candidate.matchedVenue.id}`}>
                Matched venue: {candidate.matchedVenue.name}
              </Link>
            ) : null}
          </Card>

          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">Actions</h2>
            <p className="mt-2 text-sm text-muted-foreground">No public venue is created until this candidate is approved as new.</p>
            <div className="mt-5 space-y-3">
              <form action={approveStagedVenueAsNew.bind(null, candidate.id)}>
                <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canReview}>
                  Approve as New Venue
                </button>
              </form>
              <form action={rejectStagedVenueCandidate.bind(null, candidate.id)}>
                <button className="w-full rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canReview}>
                  Reject Candidate
                </button>
              </form>
              <form action={archiveStagedVenueCandidate.bind(null, candidate.id)}>
                <button className="w-full rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canReview}>
                  Archive Candidate
                </button>
              </form>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
