import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminVenues, listDuplicateCandidates } from "@/services/admin";

type AdminDuplicatesPageProps = {
  searchParams?: Promise<{ updated?: string }>;
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminDuplicatesPage({ searchParams }: AdminDuplicatesPageProps) {
  const params = await searchParams;
  const [candidates, venues] = await Promise.all([listDuplicateCandidates(), listAdminVenues()]);
  const activeVenues = venues.filter((venue) => !venue.archived_at);

  return (
    <div>
      <Badge>Duplicate Resolution</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue duplicate review.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Review import duplicate candidates, compare production venue records side-by-side, and archive duplicates only after previewing the merge impact.
      </p>
      {params?.updated === "merged" ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Duplicate merged and archived.
        </p>
      ) : null}

      <Card className="mt-8 bg-card/90 p-5">
        <h2 className="font-serif text-2xl font-semibold">Compare production venues</h2>
        <form action="/admin/duplicates/compare" className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold">
            Duplicate venue to archive
            <select name="sourceVenueId" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Select duplicate</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Canonical venue to keep
            <select name="targetVenueId" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Select canonical venue</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Preview merge</button>
          </div>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="font-serif text-3xl font-semibold">Import duplicate queue</h2>
        <div className="mt-5 space-y-4">
          {candidates.length ? candidates.map((candidate) => (
            <Card key={candidate.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-2xl font-semibold">{candidate.name ?? "Unnamed staged venue"}</h3>
                    <Badge>{label(candidate.duplicate_review_status)}</Badge>
                    <Badge>{label(candidate.approval_status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{candidate.city ?? "Unknown city"}, {candidate.country ?? "Unknown country"}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Source: {candidate.source}{candidate.source_id ? ` · ${candidate.source_id}` : ""} · Batch: {candidate.importBatch?.source_name ?? "Unknown"}
                  </p>
                  {candidate.duplicateVenue ? (
                    <p className="mt-2 text-sm">
                      Possible match: <Link className="font-semibold text-primary hover:underline" href={`/admin/venues/${candidate.duplicateVenue.id}`}>{candidate.duplicateVenue.name}</Link>
                      <span className="text-muted-foreground"> · {candidate.duplicateVenue.city}, {candidate.duplicateVenue.country}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">No existing venue selected yet.</p>
                  )}
                </div>
                {candidate.import_batch_id ? (
                  <Link className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" href={`/admin/imports/${candidate.import_batch_id}`}>
                    Review in import batch
                  </Link>
                ) : null}
              </div>
            </Card>
          )) : (
            <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No staged duplicate candidates are waiting for review.</Card>
          )}
        </div>
      </div>
    </div>
  );
}
