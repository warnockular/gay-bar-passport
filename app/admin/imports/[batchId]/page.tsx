import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mergeStagedVenue, rejectStagedVenueCandidate } from "@/features/admin/actions";
import { getImportBatch, getImportBatchStats, listAdminVenues, listStagedVenues } from "@/services/admin";
import { venueCategoryLabel } from "@/lib/venue-categories";

type AdminImportBatchPageProps = {
  params: Promise<{ batchId: string }>;
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

function JsonPreview({ value }: { value: unknown }) {
  return (
    <pre className="mt-3 max-h-44 overflow-auto rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bCsv\b/g, "CSV")
    .replace(/\bLgbtq\b/g, "LGBTQ");
}

function statusLabel(value: string) {
  if (value === "pending") return "Pending Review";
  if (value === "approved") return "Approved";
  if (value === "merged") return "Merged";
  if (value === "rejected") return "Rejected";
  if (value === "archived") return "Archived";
  return humanize(value);
}

function duplicateLabel(value: string) {
  if (value === "unique") return "No Duplicate Found";
  if (value === "possible_duplicate") return "Possible Duplicate";
  if (value === "confirmed_duplicate") return "Confirmed Duplicate";
  return humanize(value);
}

function sourceLabel(value: string) {
  if (value === "curated_csv") return "Curated CSV";
  if (value === "google_places") return "Google Places";
  if (value === "openstreetmap") return "OpenStreetMap";
  if (value === "wikidata") return "Wikidata";
  return humanize(value);
}

function outcomeLabel(venue: Awaited<ReturnType<typeof listStagedVenues>>[number]) {
  if (venue.approval_status !== "approved") return null;
  if (venue.matched_venue_id) return "✓ Updated existing venue";
  if (venue.approvedVenue) return "✓ Created new venue";
  return "✓ Approved";
}

type CsvImportError = { errors?: string[]; row?: number; values?: Record<string, string> };

function invalidRows(value: unknown): CsvImportError[] {
  return Array.isArray(value) ? value.filter((row): row is CsvImportError => Boolean(row && typeof row === "object")) : [];
}

export default async function AdminImportBatchPage({ params, searchParams }: AdminImportBatchPageProps) {
  const { batchId } = await params;
  const query = (await searchParams) ?? {};
  const [batch, stagedVenues, stats, venues] = await Promise.all([getImportBatch(batchId), listStagedVenues(batchId), getImportBatchStats(batchId), listAdminVenues()]);

  if (!batch) notFound();
  const errors = invalidRows(batch.error_details);

  return (
    <div>
      <Badge>Import Batch</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">{batch.source_name}</h1>
      {query.updated === "csv-staged" ? (
        <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
          CSV import staged. Review valid rows below before any future approval workflow.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          Import staging failed: {query.error}
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Status</p><p className="mt-2 font-semibold">{humanize(batch.status)}</p></Card>
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Total rows</p><p className="mt-2 font-semibold">{batch.total_count || stats.total}</p></Card>
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Staged</p><p className="mt-2 font-semibold">{batch.staged_count || stats.total}</p></Card>
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Invalid</p><p className="mt-2 font-semibold">{batch.invalid_count}</p></Card>
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Pending</p><p className="mt-2 font-semibold">{stats.pending}</p></Card>
        <Card className="bg-card/90 p-4"><p className="text-xs uppercase text-muted-foreground">Duplicates</p><p className="mt-2 font-semibold">{stats.duplicateCandidates}</p></Card>
      </div>
      <Card className="mt-6 bg-card/90 p-5 text-sm text-muted-foreground">
        <div className="grid gap-2 sm:grid-cols-3">
          <p><span className="font-semibold text-foreground">Source:</span> {sourceLabel(batch.source_type)}</p>
          <p><span className="font-semibold text-foreground">Imported:</span> {batch.completed_at ? new Date(batch.completed_at).toLocaleString() : batch.started_at ? new Date(batch.started_at).toLocaleString() : "Not imported"}</p>
          <p><span className="font-semibold text-foreground">Status:</span> {humanize(batch.status)}</p>
          {stats.merged > 0 ? <p><span className="font-semibold text-foreground">Merged:</span> {stats.merged}</p> : null}
        </div>
      </Card>
      {errors.length ? (
        <Card className="mt-6 bg-card/90 p-5">
          <h2 className="font-serif text-2xl font-semibold">Invalid rows</h2>
          <p className="mt-2 text-sm text-muted-foreground">These rows were skipped. Valid rows from the same CSV were still staged.</p>
          <div className="mt-4 space-y-3">
            {errors.slice(0, 25).map((error, index) => (
              <div key={`${error.row ?? index}-${index}`} className="rounded-md border border-border bg-background/70 p-3 text-sm">
                <p className="font-semibold">Row {error.row ?? "unknown"}</p>
                <p className="mt-1 text-destructive">{(error.errors ?? ["Invalid row."]).join(" ")}</p>
                {error.values ? <JsonPreview value={error.values} /> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <div className="mt-8 space-y-4">
        {stagedVenues.length ? (
          stagedVenues.map((venue) => (
            <Card key={venue.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl font-semibold">{venue.name ?? "Unnamed staged venue"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{venue.city ?? "Unknown city"}, {venue.country ?? "Unknown country"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {outcomeLabel(venue) ? <Badge>{outcomeLabel(venue)}</Badge> : <Badge>{statusLabel(venue.approval_status)}</Badge>}
                    <Badge>{duplicateLabel(venue.duplicate_review_status)}</Badge>
                    {venue.suggested_category ? <Badge>{venueCategoryLabel(venue.suggested_category)}</Badge> : null}
                    <Badge>{sourceLabel(venue.source)}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {venue.phone ? `Phone: ${venue.phone} · ` : ""}{venue.postal_code ? `Postal: ${venue.postal_code}` : ""}
                  </p>
                  {venue.suggested_tags.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">Suggested tags: {venue.suggested_tags.join(", ")}</p>
                  ) : null}
                  {venue.duplicateVenue ? <p className="mt-2 text-xs text-muted-foreground">Duplicate target: {venue.duplicateVenue.name}, {venue.duplicateVenue.city}</p> : null}
                  <details className="mt-4 rounded-md border border-border bg-background/70 p-3">
                    <summary className="cursor-pointer text-sm font-semibold">Source details and raw payload</summary>
                    <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      {venue.source_id ? <div><dt className="font-semibold text-foreground">Source ID</dt><dd className="break-words">{venue.source_id}</dd></div> : null}
                      {venue.source_url ? <div><dt className="font-semibold text-foreground">Source URL</dt><dd className="break-words">{venue.source_url}</dd></div> : null}
                      {venue.confidence_score !== null ? <div><dt className="font-semibold text-foreground">Confidence</dt><dd>{venue.confidence_score}/100</dd></div> : null}
                    </dl>
                    <JsonPreview value={{ raw_data: venue.raw_data, source_metadata: venue.source_metadata }} />
                  </details>
                </div>
                <div className="w-full space-y-3 md:w-72">
                  <Link className="block rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground" href={`/admin/imports/staged/${venue.id}`}>
                    Review Candidate
                  </Link>
                  {venue.approval_status === "pending" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={rejectStagedVenueCandidate.bind(null, venue.id)}>
                      <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Reject</button>
                    </form>
                  </div>
                  ) : null}
                  {["possible_duplicate", "confirmed_duplicate"].includes(venue.duplicate_review_status) ? (
                  <form action={mergeStagedVenue.bind(null, venue.id, batch.id)} className="space-y-2">
                    <select name="existingVenueId" className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm" defaultValue={venue.duplicate_existing_venue_id ?? ""}>
                      <option value="">Select existing venue</option>
                      {venues.map((existingVenue) => (
                        <option key={existingVenue.id} value={existingVenue.id}>{existingVenue.name} · {existingVenue.city}</option>
                      ))}
                    </select>
                    <button className="w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Mark merged</button>
                  </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No staged venues in this batch. Future import providers will write records here for review.</Card>
        )}
      </div>
    </div>
  );
}
