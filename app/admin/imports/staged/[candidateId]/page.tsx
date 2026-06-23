import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { approveStagedVenueAsNew, rejectStagedVenueCandidate, updateExistingVenueFromStagedCandidate, updateStagedVenueCandidate } from "@/features/admin/actions";
import { venueCategoryLabel, venueCategoryOptions } from "@/lib/venue-categories";
import { getStagedVenue, listImportCandidateMatches, listStagedCandidateAuditLogs, type CandidateAuditLog, type ImportCandidateMatch } from "@/services/admin";

type StagedCandidatePageProps = {
  params: Promise<{ candidateId: string }>;
  searchParams?: Promise<{ edit?: string; error?: string; updated?: string }>;
};

const safeUpdateFields = [
  { label: "Website", value: "website_url" },
  { label: "Phone", value: "phone" },
  { label: "Hours", value: "opening_hours" },
  { label: "Coordinates", value: "coordinates" },
  { label: "Image URL", value: "image_url" }
];

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
  const value = textFrom(...values);
  return value === "Not provided" ? "" : value;
}

function feedbackMessage(updated?: string) {
  if (updated === "approved") return "Candidate approved as a new pending venue.";
  if (updated === "edited") return "Candidate changes saved.";
  if (updated === "updated-existing") return "Candidate approved and used to update an existing venue.";
  if (updated === "rejected") return "Candidate rejected.";
  return null;
}

function humanStatus(value: string) {
  return value.split("_").map((part) => part.slice(0, 1).toUpperCase() + part.slice(1)).join(" ");
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    import_candidate_approved_as_new_venue: "Approved as new venue",
    import_candidate_archived: "Archived candidate",
    import_candidate_edited: "Edited candidate",
    import_candidate_rejected: "Rejected candidate",
    import_candidate_updated_existing_venue: "Updated existing venue",
    venue_import_approved: "Approved candidate",
    venue_import_rejected: "Rejected candidate"
  };
  return labels[action] ?? humanStatus(action);
}

function metadataSummary(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const entries = Object.entries(metadata).filter(([key, value]) =>
    value !== null
    && value !== undefined
    && value !== ""
    && !key.toLowerCase().endsWith("id")
  );
  if (!entries.length) return null;
  return entries.map(([key, value]) => `${humanStatus(key)}: ${typeof value === "string" ? humanStatus(value) : String(value)}`).join(" · ");
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border/70 py-2 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm">{value || "Not provided"}</dd>
    </div>
  );
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
      <textarea className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal" name={name} defaultValue={value} />
    </label>
  );
}

function SourceDetails({ candidate, raw }: { candidate: NonNullable<Awaited<ReturnType<typeof getStagedVenue>>>; raw: unknown }) {
  return (
    <details className="rounded-md border border-border bg-card/90 p-4">
      <summary className="cursor-pointer text-sm font-semibold">Source details and raw payload</summary>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <DetailRow label="Source" value={candidate.source} />
        <DetailRow label="Source ID" value={candidate.source_id ?? "Not provided"} />
        <DetailRow label="Source URL" value={candidate.source_url ? <a className="text-primary hover:underline" href={candidate.source_url} target="_blank" rel="noreferrer">{candidate.source_url}</a> : "Not provided"} />
        <DetailRow label="Last seen" value={candidate.last_seen_at ? new Date(candidate.last_seen_at).toLocaleString() : "Not provided"} />
      </dl>
      <pre className="mt-4 max-h-72 overflow-auto rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
        {JSON.stringify(raw, null, 2)}
      </pre>
    </details>
  );
}

function MatchDifference({ difference }: { difference: ImportCandidateMatch["differences"][number] }) {
  return (
    <div className="rounded-md border border-border bg-background/60 p-3 text-xs">
      <p className="font-semibold">{difference.field}</p>
      <p className="mt-1 break-words text-muted-foreground">Current: {difference.currentValue}</p>
      <p className="mt-1 break-words">Imported: {difference.importedValue}</p>
    </div>
  );
}

function AuditHistory({ logs }: { logs: CandidateAuditLog[] }) {
  return (
    <Card className="bg-card/90 p-5">
      <h2 className="font-serif text-2xl font-semibold">Audit History</h2>
      {logs.length ? (
        <ol className="mt-4 space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="rounded-md border border-border bg-background/60 p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-semibold">{actionLabel(log.action)}</p>
                <time className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</time>
              </div>
              <p className="mt-1 text-muted-foreground">By {log.actor?.display_name ?? "System"}</p>
              {metadataSummary(log.metadata) ? <p className="mt-2 text-xs text-muted-foreground">{metadataSummary(log.metadata)}</p> : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No audit events recorded for this candidate yet.</p>
      )}
    </Card>
  );
}

function MatchCard({ canReview, candidateId, match }: { canReview: boolean; candidateId: string; match: ImportCandidateMatch }) {
  const safeDifferences = match.differences.filter((difference) =>
    ["Website", "Phone", "Opening hours", "Coordinates", "Image URL"].includes(difference.field)
  );

  return (
    <Card className="bg-card/90 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-semibold">{match.venue.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{match.venue.city}, {match.venue.country}</p>
        </div>
        <Badge>{match.confidenceScore}% match</Badge>
      </div>
      {match.reasons.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {match.reasons.map((reason) => <Badge key={reason} className="bg-terracotta/10 text-terracotta">{reason}</Badge>)}
        </div>
      ) : null}
      {safeDifferences.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {safeDifferences.map((difference) => <MatchDifference key={difference.field} difference={difference} />)}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">No safe field differences to apply.</p>
      )}
      <form action={updateExistingVenueFromStagedCandidate.bind(null, candidateId)} className="mt-4 space-y-4">
        <input type="hidden" name="venueId" value={match.venue.id} />
        <fieldset className="rounded-md border border-border bg-background/60 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Safe fields to update</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {safeUpdateFields.map((field) => (
              <label key={field.value} className="flex items-center gap-2 text-sm">
                <input className="h-4 w-4" type="checkbox" name="safeFields" value={field.value} defaultChecked />
                {field.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!canReview}>
            Update Existing Venue
          </button>
          <Link className="rounded-md border border-border bg-background/70 px-4 py-2 text-center text-sm font-semibold hover:bg-muted" href={`/admin/venues/${match.venue.id}`}>
            Open current venue
          </Link>
        </div>
      </form>
    </Card>
  );
}

export default async function StagedCandidatePage({ params, searchParams }: StagedCandidatePageProps) {
  const { candidateId } = await params;
  const query = (await searchParams) ?? {};
  const candidate = await getStagedVenue(candidateId);
  if (!candidate) notFound();

  const [matches, auditLogs] = await Promise.all([
    listImportCandidateMatches(candidate),
    listStagedCandidateAuditLogs(candidate.id)
  ]);
  const topMatches = matches
    .filter((match) => match.confidenceScore >= 30)
    .slice(0, 3);
  const raw = asObject(candidate.raw_data);
  const metadata = asObject(candidate.source_metadata);
  const address = asObject(candidate.address_components);
  const feedback = feedbackMessage(query.updated);
  const categoryValue = venueCategoryOptions.some((option) => option.value === candidate.suggested_category) ? candidate.suggested_category ?? "" : "";
  const category = categoryValue ? venueCategoryLabel(categoryValue) : textFrom(raw.category);
  const isPending = candidate.approval_status === "pending";
  const isEditing = query.edit === "1" && isPending;
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
    <div className="space-y-6">
      <Card className="bg-card/90 p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>Imported Candidate</Badge>
              <Badge>{candidate.confidence_score !== null ? `${candidate.confidence_score}% confidence` : "No confidence score"}</Badge>
              <Badge>{candidate.source}</Badge>
              <Badge>{humanStatus(candidate.approval_status)}</Badge>
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight">{textFrom(candidate.name, raw.name)}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{category} · {textFrom(candidate.city, raw.city, address.city)}, {textFrom(candidate.country, raw.country, address.country)}</p>
          </div>
          <div className="grid content-start gap-2 sm:grid-cols-3 lg:w-96">
            {isPending ? (
              <Link className="rounded-md border border-border bg-background/70 px-4 py-2 text-center text-sm font-semibold hover:bg-muted" href={isEditing ? `/admin/imports/staged/${candidate.id}` : `/admin/imports/staged/${candidate.id}?edit=1`}>
                {isEditing ? "Cancel Edit" : "Edit Candidate"}
              </Link>
            ) : null}
            {isPending ? (
              <>
                <form action={approveStagedVenueAsNew.bind(null, candidate.id)}>
                  <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
                    Approve New
                  </button>
                </form>
                <form action={rejectStagedVenueCandidate.bind(null, candidate.id)}>
                  <button className="w-full rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                    Reject
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {feedback ? (
        <p className="rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">{feedback}</p>
      ) : null}
      {query.error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          Action failed: {query.error}
        </p>
      ) : null}

      <div className={isPending ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]" : "grid gap-5"}>
        <main className="space-y-5">
          {!isPending ? (
            <Card className="bg-card/90 p-5">
              <h2 className="font-serif text-2xl font-semibold">Review Outcome</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                This candidate is {humanStatus(candidate.approval_status).toLowerCase()} and is now read-only history.
              </p>
              {candidate.approvedVenue ? (
                <Link className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/admin/venues/${candidate.approvedVenue.id}`}>
                  Open venue: {candidate.approvedVenue.name}
                </Link>
              ) : candidate.matchedVenue ? (
                <Link className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={`/admin/venues/${candidate.matchedVenue.id}`}>
                  Open matched venue: {candidate.matchedVenue.name}
                </Link>
              ) : null}
            </Card>
          ) : null}

          {isEditing ? (
            <Card className="bg-card/90 p-5">
              <h2 className="font-serif text-2xl font-semibold">Edit Candidate</h2>
              <p className="mt-2 text-sm text-muted-foreground">Clean up staged data before approval. The original raw import payload stays unchanged.</p>
              <form action={updateStagedVenueCandidate.bind(null, candidate.id)} className="mt-5 grid gap-4 md:grid-cols-2">
                <TextInput label="Name" name="name" value={values.name} />
                <label className="grid gap-2 text-sm font-semibold">
                  Category
                  <select className="rounded-md border border-border bg-background px-3 py-2 text-sm font-normal" name="category" defaultValue={categoryValue}>
                    <option value="">Choose category</option>
                    {venueCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:col-span-2" type="submit">
                  Save Candidate Changes
                </button>
              </form>
            </Card>
          ) : null}

          {isPending ? (
            <Card className="bg-card/90 p-5">
              <h2 className="font-serif text-2xl font-semibold">Candidate Details</h2>
              <dl className="mt-4">
                <DetailRow label="Address" value={textFrom(address.address, metadata.address, raw.address)} />
                <DetailRow label="Neighborhood" value={textFrom(address.neighborhood, metadata.neighborhood, raw.neighborhood)} />
                <DetailRow label="City" value={textFrom(candidate.city, raw.city, address.city)} />
                <DetailRow label="Region" value={textFrom(address.region, metadata.region, raw.region)} />
                <DetailRow label="Country" value={textFrom(candidate.country, raw.country, address.country)} />
                <DetailRow label="Postal code" value={textFrom(candidate.postal_code, address.postal_code, raw.postal_code)} />
                <DetailRow label="Phone" value={textFrom(candidate.phone, raw.phone)} />
                <DetailRow label="Website" value={textFrom(metadata.website_url, raw.website_url)} />
                <DetailRow label="Hours" value={textFrom(metadata.opening_hours, raw.opening_hours)} />
                <DetailRow label="Suggested tags" value={candidate.suggested_tags.length ? candidate.suggested_tags.join(", ") : "Not provided"} />
              </dl>
            </Card>
          ) : null}

          {isPending ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold">Existing Venue Matches</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review the strongest matches first. Low-confidence matches are hidden from this page.</p>
              </div>
              {topMatches.length ? (
                topMatches.map((match) => <MatchCard key={match.venue.id} canReview={isPending} candidateId={candidate.id} match={match} />)
              ) : (
                <Card className="bg-card/90 p-5 text-sm text-muted-foreground">No likely existing venue matches above 30% confidence.</Card>
              )}
            </section>
          ) : null}

          {!isPending ? <AuditHistory logs={auditLogs} /> : null}

          <SourceDetails candidate={candidate} raw={candidate.raw_data} />
        </main>

        {isPending ? (
          <aside className="space-y-5">
            <Card className="bg-card/90 p-5">
              <h2 className="font-serif text-2xl font-semibold">Metadata</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="font-semibold">Batch</dt><dd className="text-muted-foreground">{candidate.importBatch ? <Link className="text-primary hover:underline" href={`/admin/imports/${candidate.importBatch.id}`}>{candidate.importBatch.source_name}</Link> : "Unknown"}</dd></div>
                <div><dt className="font-semibold">Approval status</dt><dd className="text-muted-foreground">{humanStatus(candidate.approval_status)}</dd></div>
                <div><dt className="font-semibold">Last edited</dt><dd className="text-muted-foreground">{candidate.edited_at ? `${new Date(candidate.edited_at).toLocaleString()} by ${candidate.editedBy?.display_name ?? "Admin user"}` : "Not edited"}</dd></div>
              </dl>
            </Card>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
