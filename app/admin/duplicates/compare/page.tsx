import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mergeDuplicateVenue } from "@/features/admin/actions";
import { getVenueMergePreview, listAdminVenues, type AdminVenue } from "@/services/admin";

type AdminDuplicateComparePageProps = {
  searchParams?: Promise<{ sourceVenueId?: string; targetVenueId?: string }>;
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function VenuePanel({ title, venue }: { title: string; venue: AdminVenue }) {
  return (
    <Card className="bg-card/90 p-5">
      <Badge>{title}</Badge>
      <h2 className="mt-4 font-serif text-3xl font-semibold">{venue.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{venue.city}, {venue.country}</p>
      <dl className="mt-5 grid gap-3 text-sm">
        <div><dt className="font-semibold">Category</dt><dd className="text-muted-foreground">{label(venue.category)}</dd></div>
        <div><dt className="font-semibold">Address</dt><dd className="text-muted-foreground">{venue.address ?? venue.neighborhood ?? "Missing"}</dd></div>
        <div><dt className="font-semibold">Website</dt><dd className="break-all text-muted-foreground">{venue.website_url ?? "Missing"}</dd></div>
        <div><dt className="font-semibold">Verification</dt><dd className="text-muted-foreground">{label(venue.verification_status)} · {venue.verification_score}/100</dd></div>
        <div><dt className="font-semibold">Readiness</dt><dd className="text-muted-foreground">{label(venue.readiness_status)} · {venue.completeness_score}/100 complete</dd></div>
        <div><dt className="font-semibold">Source</dt><dd className="text-muted-foreground">{venue.source ?? "Manual"}{venue.source_id ? ` · ${venue.source_id}` : ""}</dd></div>
        <div><dt className="font-semibold">Status</dt><dd className="text-muted-foreground">{venue.archived_at ? `Archived ${venue.archived_at}` : label(venue.review_status)}</dd></div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">{venue.description ?? "No description."}</p>
      <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={`/admin/venues/${venue.id}`}>Open venue management</Link>
    </Card>
  );
}

export default async function AdminDuplicateComparePage({ searchParams }: AdminDuplicateComparePageProps) {
  const params = await searchParams;
  const [venues, preview] = await Promise.all([
    listAdminVenues(),
    params?.sourceVenueId && params?.targetVenueId ? getVenueMergePreview(params.sourceVenueId, params.targetVenueId) : Promise.resolve(null)
  ]);
  const activeVenues = venues.filter((venue) => !venue.archived_at);

  return (
    <div>
      <Badge>Merge Preview</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Compare duplicate venues.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Choose the duplicate record to archive and the canonical record to keep. The merge action is only available after this preview.
      </p>

      <Card className="mt-8 bg-card/90 p-5">
        <form action="/admin/duplicates/compare" className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold">
            Duplicate venue to archive
            <select name="sourceVenueId" defaultValue={params?.sourceVenueId ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Select duplicate</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Canonical venue to keep
            <select name="targetVenueId" defaultValue={params?.targetVenueId ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Select canonical venue</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Refresh preview</button>
          </div>
        </form>
      </Card>

      {preview ? (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <VenuePanel title="Duplicate to archive" venue={preview.sourceVenue} />
            <VenuePanel title="Canonical venue to keep" venue={preview.targetVenue} />
          </div>

          <Card className="mt-6 bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Merge impact preview</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Favorites</p><p className="mt-2 text-2xl font-semibold">{preview.favorites}</p><p className="text-xs text-muted-foreground">{preview.favoriteConflicts} duplicate favorite(s) already exist on target.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Visits</p><p className="mt-2 text-2xl font-semibold">{preview.visits}</p><p className="text-xs text-muted-foreground">{preview.visitConflicts} conflicting visit(s) stay attached to archived record.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Passport stamps</p><p className="mt-2 text-2xl font-semibold">{preview.passportStamps}</p><p className="text-xs text-muted-foreground">Moved to canonical venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Journal entries</p><p className="mt-2 text-2xl font-semibold">{preview.journals}</p><p className="text-xs text-muted-foreground">Moved to canonical venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Tags</p><p className="mt-2 text-2xl font-semibold">{preview.tags}</p><p className="text-xs text-muted-foreground">Missing tags copied to canonical venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Duplicate record</p><p className="mt-2 text-2xl font-semibold">Archived</p><p className="text-xs text-muted-foreground">Never hard deleted.</p></div>
            </div>
            <form action={mergeDuplicateVenue} className="mt-6 space-y-4">
              <input type="hidden" name="sourceVenueId" value={preview.sourceVenue.id} />
              <input type="hidden" name="targetVenueId" value={preview.targetVenue.id} />
              <label className="grid gap-2 text-sm font-semibold">
                Merge reason
                <textarea name="mergeReason" className="min-h-24 rounded-md border border-input bg-background/80 px-3 py-2 text-sm" placeholder="Why is this venue a duplicate?" />
              </label>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
                Merge and archive duplicate
              </button>
            </form>
          </Card>
        </>
      ) : (
        <Card className="mt-8 bg-card/90 p-6 text-sm text-muted-foreground">Select two different active venues to preview a merge.</Card>
      )}
    </div>
  );
}
