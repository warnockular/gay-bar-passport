import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { approveStagedVenueAsNew, archiveStagedVenueCandidate, rejectStagedVenueCandidate, updateExistingVenueFromStagedCandidate, updateStagedVenueCandidate } from "@/features/admin/actions";
import { venueCategoryLabel, venueCategoryOptions } from "@/lib/venue-categories";
import { getStagedVenue, listImportCandidateMatches, type ImportCandidateMatch } from "@/services/admin";

type StagedCandidatePageProps = {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ edit?: string; error?: string; updated?: string }>;
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

function formValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
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
  if (updated === "edited") return "Candidate changes saved.";
  if (updated === "updated-existing") return "Candidate approved and used to update an existing venue.";
  if (updated === "rejected") return "Candidate rejected.";
  if (updated === "archived") return "Candidate archived.";
  return null;
}

function TextInput({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal" name={name} defaultValue={value} />
    </label>
  );
}

function TextArea({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold md:col-span-2">
      {label}
      <textarea className="min-h-28 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal" name={name} defaultValue={value} />
    </label>
  );
}

function MatchCard({ canReview, candidateId, match }: { canReview: boolean; candidateId: string; match: ImportCandidateMatch }) {
  return (
    <Card className="bg-card/90 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge>{match.confidenceLabel}</Badge>
          <h3 className="mt-3 font-serif text-2xl font-semibold">{match.venue.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{match.venue.city}, {match.venue.country}</p>
        </div>
        <Badge className="bg-background/70">{match.confidenceScore}/100</Badge>
      </div>
      {match.reasons.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {match.reasons.map((reason) => <Badge key={reason} className="bg-terracotta/10 text-terracotta">{reason}</Badge>)}
        </div>
      ) : null}
      <div className="mt-5 overflow-hidden rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="p-2">Field</th>
              <th className="p-2">Current value</th>
              <th className="p-2">Imported value</th>
            </tr>
          </thead>
          <tbody>
            {match.differences.map((difference) => (
              <tr key={difference.field} className="border-t border-border">
                <th className="p-2 font-semibold">{difference.field}</th>
                <td className="max-w-44 break-words p-2 text-muted-foreground">{difference.currentValue}</td>
                <td className="max-w-44 break-words p-2">{difference.importedValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={updateExistingVenueFromStagedCandidate.bind(null, candidateId)} className="mt-4">
        <input type="hidden" name="venueId" value={match.venue.id} />
        <button className="w-full rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canReview}>
          Update Existing Venue
        </button>
      </form>
      <Link className="mt-3 block text-center text-sm font-semibold text-primary hover:underline" href={`/admin/venues/${match.venue.id}`}>
        Open current venue
      </Link>
    </Card>
  );
}

export default async function StagedCandidatePage({ params, searchParams }: StagedCandidatePageProps) {
  const { candidateId } = await params;
  const query = (await searchParams) ?? {};
  const candidate = await getStagedVenue(candidateId);
  if (!candidate) notFound();
  const matches = await listImportCandidateMatches(candidate);

  const raw = asObject(candidate.raw_data);
  const metadata = asObject(candidate.source_metadata);
  const address = asObject(candidate.address_components);
  const feedback = feedbackMessage(query.updated);
  const categoryValue = venueCategoryOptions.some((option) => option.value === candidate.suggested_category) ? candidate.suggested_category ?? "" : "";
  const category = categoryValue ? venueCategoryLabel(categoryValue) : textFrom(raw.category);
  const canReview = candidate.approval_status !== "approved";
  const isEditing = query.edit === "1" && canReview;
  const values = {
    address: formValue(address.address, metadata.address, raw.address),
    city: formValue(candidate.city, raw.city, address.city),
    confidenceScore: candidate.confidence_score !== null ? String(candidate.confidence_score) : "",
    country: formValue(candidate.country, raw.country, address.country),
    description: formValue(metadata.description, raw.description, candidate.review_notes),
    imageUrl: formValue(metadata.image_url, raw.image_url),
    latitude: candidate.latitude !== null ? String(candidate.latitude) : "",
    longitude: candidate.longitude !== null ? String(candidate.longitude) : "",
    name: formValue(candidate.name, raw.name),
    neighborhood: formValue(address.neighborhood, metadata.neighborhood, raw.neighborhood),
    notes: formValue(candidate.review_notes),
    openingHours: formValue(metadata.opening_hours, raw.opening_hours),
    phone: formValue(candidate.phone, raw.phone),
    postalCode: formValue(candidate.postal_code, address.postal_code, raw.postal_code),
    region: formValue(address.region, metadata.region, raw.region),
    suggestedTags: candidate.suggested_tags.join(", "),
    websiteUrl: formValue(metadata.website_url, raw.website_url)
  };

  return (
    <div>
      <Badge>Imported Candidate</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">{textFrom(candidate.name, raw.name)}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Review this staged import candidate before creating a real venue record. Approval creates a pending, unpublished imported venue.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {canReview ? (
          isEditing ? (
            <Link className="rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted" href={`/admin/imports/staged/${candidate.id}`}>
              Cancel editing
            </Link>
          ) : (
            <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/admin/imports/staged/${candidate.id}?edit=1`}>
              Edit Candidate
            </Link>
          )
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">{feedback}</p>
      ) : null}
      {query.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          Action failed: {query.error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-6">
          {isEditing ? (
            <Card className="bg-card/90 p-5">
              <h2 className="font-serif text-3xl font-semibold">Edit Candidate</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Clean up staged data before approval. The original raw import payload stays unchanged.
              </p>
              <form action={updateStagedVenueCandidate.bind(null, candidate.id)} className="mt-5 grid gap-4 md:grid-cols-2">
                <TextInput label="Name" name="name" value={values.name} />
                <label className="grid gap-2 text-sm font-semibold">
                  Category
                  <select className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal" name="category" defaultValue={categoryValue}>
                    <option value="">Choose category</option>
                    {venueCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <TextInput label="Address" name="address" value={values.address} />
                <TextInput label="Neighborhood" name="neighborhood" value={values.neighborhood} />
                <TextInput label="City" name="city" value={values.city} />
                <TextInput label="Region" name="region" value={values.region} />
                <TextInput label="Country" name="country" value={values.country} />
                <TextInput label="Postal code" name="postalCode" value={values.postalCode} />
                <TextInput label="Latitude" name="latitude" value={values.latitude} />
                <TextInput label="Longitude" name="longitude" value={values.longitude} />
                <TextInput label="Website URL" name="websiteUrl" value={values.websiteUrl} />
                <TextInput label="Phone" name="phone" value={values.phone} />
                <TextInput label="Image URL" name="imageUrl" value={values.imageUrl} />
                <TextInput label="Confidence score" name="confidenceScore" value={values.confidenceScore} />
                <TextArea label="Opening hours" name="openingHours" value={values.openingHours} />
                <TextArea label="Description" name="description" value={values.description} />
                <TextArea label="Suggested tags" name="suggestedTags" value={values.suggestedTags} />
                <TextArea label="Notes" name="notes" value={values.notes} />
                <div className="flex flex-wrap gap-3 md:col-span-2">
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
                    Save Candidate Changes
                  </button>
                  <Link className="rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted" href={`/admin/imports/staged/${candidate.id}`}>
                    Cancel
                  </Link>
                </div>
              </form>
            </Card>
          ) : null}

          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-3xl font-semibold">Candidate Details</h2>
            <dl className="mt-5 grid gap-3 md:grid-cols-2">
              <Field label="Name" value={textFrom(candidate.name, raw.name)} />
              <Field label="Category" value={category} />
              <Field label="Address" value={textFrom(address.address, metadata.address, raw.address)} />
              <Field label="Neighborhood" value={textFrom(address.neighborhood, metadata.neighborhood, raw.neighborhood)} />
              <Field label="City" value={textFrom(candidate.city, raw.city, address.city)} />
              <Field label="Region" value={textFrom(address.region, metadata.region, raw.region)} />
              <Field label="Country" value={textFrom(candidate.country, raw.country, address.country)} />
              <Field label="Postal code" value={textFrom(candidate.postal_code, address.postal_code, raw.postal_code)} />
              <Field label="Coordinates" value={candidate.latitude !== null && candidate.longitude !== null ? `${candidate.latitude}, ${candidate.longitude}` : "Not provided"} />
              <Field label="Website" value={textFrom(metadata.website_url, raw.website_url)} />
              <Field label="Phone" value={textFrom(candidate.phone, raw.phone)} />
              <Field label="Image URL" value={textFrom(metadata.image_url, raw.image_url)} />
              <Field label="Opening hours" value={textFrom(metadata.opening_hours, raw.opening_hours)} />
              <Field label="Description" value={textFrom(metadata.description, raw.description, candidate.review_notes)} />
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
            <h2 className="font-serif text-2xl font-semibold">Possible Existing Venues</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ranked by name, slug, city, website, coordinates, and address similarity. Updating an existing venue only enriches safe operational fields.
            </p>
          </Card>
          {matches.length ? (
            matches.map((match) => <MatchCard key={match.venue.id} canReview={canReview} candidateId={candidate.id} match={match} />)
          ) : (
            <Card className="bg-card/90 p-5 text-sm text-muted-foreground">No likely existing venue matches found.</Card>
          )}
          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">Staging Metadata</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold">Batch</dt><dd className="text-muted-foreground">{candidate.importBatch ? <Link className="text-primary hover:underline" href={`/admin/imports/${candidate.importBatch.id}`}>{candidate.importBatch.source_name}</Link> : "Unknown"}</dd></div>
              <div><dt className="font-semibold">Created</dt><dd className="text-muted-foreground">{new Date(candidate.created_at).toLocaleString()}</dd></div>
              <div><dt className="font-semibold">Approval status</dt><dd className="text-muted-foreground">{candidate.approval_status}</dd></div>
              <div><dt className="font-semibold">Duplicate status</dt><dd className="text-muted-foreground">{candidate.duplicate_review_status}</dd></div>
              <div><dt className="font-semibold">Last edited by</dt><dd className="text-muted-foreground">{candidate.editedBy?.display_name ?? (candidate.edited_by ? "Admin user" : "Not edited")}</dd></div>
              <div><dt className="font-semibold">Last edited</dt><dd className="text-muted-foreground">{candidate.edited_at ? new Date(candidate.edited_at).toLocaleString() : "Not edited"}</dd></div>
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
