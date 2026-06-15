import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { mergeDuplicateVenue } from "@/features/admin/actions";
import { getVenueMergePreview, listAdminVenues, type AdminVenue } from "@/services/admin";

type AdminDuplicateComparePageProps = {
  searchParams?: Promise<{ candidateId?: string; error?: string; sourceVenueId?: string; targetVenueId?: string }>;
};

function label(value?: string | null) {
  if (!value) return "Missing";
  return value
    .split("_")
    .map((part) => part.toLowerCase() === "lgbtq" ? "LGBTQ" : part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function venueQualityScore(venue: AdminVenue) {
  const verificationWeight: Record<AdminVenue["verification_status"], number> = {
    admin_verified: 35,
    community_verified: 25,
    owner_verified: 30,
    unverified: 0
  };

  return venue.completeness_score
    + verificationWeight[venue.verification_status]
    + (venue.review_status === "active" ? 12 : 0)
    + (venue.image_url ? 8 : 0)
    + (venue.latitude !== null && venue.longitude !== null ? 8 : 0)
    + (venue.opening_hours ? 6 : 0)
    + (venue.website_url ? 6 : 0)
    + (venue.description && venue.description.length > 160 ? 8 : venue.description ? 4 : 0);
}

function recommendedVenue(first: AdminVenue, second: AdminVenue) {
  return venueQualityScore(first) >= venueQualityScore(second) ? first : second;
}

function confirmationText(removeVenue: AdminVenue, keepVenue: AdminVenue) {
  return `I understand this will archive ${removeVenue.name} and keep ${keepVenue.name}.`;
}

function Field({ label: fieldLabel, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-semibold">{fieldLabel}</dt>
      <dd className="break-words text-muted-foreground">{value || "Missing"}</dd>
    </div>
  );
}

function VenueImagePreview({ venue }: { venue: AdminVenue }) {
  if (!venue.image_url) {
    return <div className="flex aspect-[16/9] items-center justify-center rounded-md border border-dashed border-border bg-background/60 text-sm text-muted-foreground">No image</div>;
  }

  return (
    <div className="aspect-[16/9] overflow-hidden rounded-md border border-border bg-background/70">
      {/* Admin-entered image URLs may be outside configured Next image hosts. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={`${venue.name} preview`} className="h-full w-full object-contain" src={venue.image_url} />
    </div>
  );
}

function VenuePanel({
  recommendation,
  role,
  venue
}: {
  recommendation: boolean;
  role: "keep" | "remove";
  venue: AdminVenue;
}) {
  const coordinates = venue.latitude !== null && venue.longitude !== null ? `${venue.latitude}, ${venue.longitude}` : "Missing";

  return (
    <Card className={role === "keep" ? "border-sage/40 bg-card/95 p-5" : "bg-card/90 p-5"}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{role === "keep" ? "Official venue to keep" : "Venue to remove after merge"}</Badge>
        {recommendation ? <Badge className="bg-sage/10 text-sage">Recommended to keep</Badge> : null}
      </div>
      <h2 className="mt-4 font-serif text-3xl font-semibold">{venue.name}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {role === "keep" ? "This venue will remain public after merge." : "This venue will be archived and hidden from travelers."}
      </p>
      <div className="mt-5">
        <VenueImagePreview venue={venue} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <Field label="Type" value={label(venue.category)} />
        <Field label="Address" value={venue.address} />
        <Field label="Neighborhood" value={venue.neighborhood} />
        <Field label="City" value={venue.city} />
        <Field label="Country" value={venue.country} />
        <Field label="Coordinates" value={coordinates} />
        <Field label="Website" value={venue.website_url} />
        <Field label="Opening hours" value={venue.opening_hours} />
        <Field label="Verification" value={`${label(venue.verification_status)} · ${venue.verification_score}/100`} />
        <Field label="Review status" value={label(venue.review_status)} />
        <Field label="Readiness" value={`${label(venue.readiness_status)} · ${venue.completeness_score}/100 complete`} />
        <Field label="Source" value={`${venue.source ?? "Manual"}${venue.source_id ? ` · ${venue.source_id}` : ""}`} />
        <Field label="Submission" value={label(venue.submission_status)} />
        <Field label="Owner claim" value={venue.claimed_by ? `Claimed${venue.claimed_at ? ` on ${new Date(venue.claimed_at).toLocaleDateString()}` : ""}` : "Not claimed"} />
      </dl>
      <div className="mt-5">
        <p className="text-sm font-semibold">Description</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{venue.description ?? "No description."}</p>
      </div>
      <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={`/admin/venues/${venue.id}`}>Open venue management</Link>
    </Card>
  );
}

function ResultPanel({ venue }: { venue: AdminVenue }) {
  const coordinates = venue.latitude !== null && venue.longitude !== null ? `${venue.latitude}, ${venue.longitude}` : "Missing";

  return (
    <Card className="mt-6 border-sage/30 bg-sage/10 p-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-sage" aria-hidden="true" />
        <h2 className="font-serif text-3xl font-semibold">After merge, this will be the official venue record.</h2>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        <VenueImagePreview venue={venue} />
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Name" value={venue.name} />
          <Field label="Address" value={venue.address} />
          <Field label="Neighborhood" value={venue.neighborhood} />
          <Field label="City / Country" value={`${venue.city}, ${venue.country}`} />
          <Field label="Website" value={venue.website_url} />
          <Field label="Coordinates" value={coordinates} />
          <Field label="Opening hours" value={venue.opening_hours} />
          <Field label="Verification" value={`${label(venue.verification_status)} · ${venue.verification_score}/100`} />
          <Field label="Review status" value={label(venue.review_status)} />
          <Field label="Description" value={venue.description} />
        </dl>
      </div>
    </Card>
  );
}

export default async function AdminDuplicateComparePage({ searchParams }: AdminDuplicateComparePageProps) {
  const params = await searchParams;
  const initialPreview = params?.sourceVenueId && params?.targetVenueId ? await getVenueMergePreview(params.sourceVenueId, params.targetVenueId) : null;
  const recommended = initialPreview ? recommendedVenue(initialPreview.sourceVenue, initialPreview.targetVenue) : null;
  const keepVenueId = params?.candidateId && recommended ? recommended.id : params?.targetVenueId;
  const removeVenueId = params?.candidateId && recommended
    ? (recommended.id === params.sourceVenueId ? params.targetVenueId : params.sourceVenueId)
    : params?.sourceVenueId;

  const [venues, preview] = await Promise.all([
    listAdminVenues(),
    removeVenueId && keepVenueId ? getVenueMergePreview(removeVenueId, keepVenueId) : Promise.resolve(null)
  ]);
  const activeVenues = venues.filter((venue) => !venue.archived_at);
  const currentRecommendation = preview ? recommendedVenue(preview.sourceVenue, preview.targetVenue) : null;
  const confirmation = preview ? confirmationText(preview.sourceVenue, preview.targetVenue) : "";

  return (
    <div>
      <Badge>Merge Preview</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Choose the official venue to keep.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Review both records carefully. One venue will remain public, and the other will be archived after the merge.
      </p>
      {params?.candidateId ? (
        <p className="mt-4 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
          Reviewing a generated duplicate candidate. The official venue is preselected using data quality signals, but an admin must still confirm the final choice.
        </p>
      ) : null}
      {params?.error === "confirmation" ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Confirmation text did not match. No merge was performed.
        </p>
      ) : null}

      <Card className="mt-8 bg-card/90 p-5">
        <form action="/admin/duplicates/compare" className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          {params?.candidateId ? <input type="hidden" name="candidateId" value={params.candidateId} /> : null}
          <label className="grid gap-2 text-sm font-semibold">
            Venue to remove after merge
            <select name="sourceVenueId" defaultValue={removeVenueId ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Choose venue to remove</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Official venue to keep
            <select name="targetVenueId" defaultValue={keepVenueId ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" required>
              <option value="">Choose official venue</option>
              {activeVenues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} · {venue.city}, {venue.country}</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Refresh comparison</button>
          </div>
        </form>
      </Card>

      {preview ? (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <VenuePanel recommendation={currentRecommendation?.id === preview.sourceVenue.id} role="remove" venue={preview.sourceVenue} />
            <VenuePanel recommendation={currentRecommendation?.id === preview.targetVenue.id} role="keep" venue={preview.targetVenue} />
          </div>

          {currentRecommendation?.id !== preview.targetVenue.id ? (
            <Card className="mt-6 border-terracotta/30 bg-terracotta/10 p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-terracotta" aria-hidden="true" />
                <div>
                  <h2 className="font-serif text-2xl font-semibold">Recommendation does not match the current keep choice.</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The system recommends keeping {currentRecommendation?.name}. Refresh the comparison with that venue selected as the official venue unless you have a clear reason to keep the other record.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <ResultPanel venue={preview.targetVenue} />

          <Card className="mt-6 bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Merge impact summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {preview.targetVenue.name} will remain public. {preview.sourceVenue.name} will be archived and no longer appear publicly.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Favorites</p><p className="mt-2 text-2xl font-semibold">{preview.favorites}</p><p className="text-xs text-muted-foreground">Moved or preserved. {preview.favoriteConflicts} duplicate favorite(s) already exist on the official venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Visits</p><p className="mt-2 text-2xl font-semibold">{preview.visits}</p><p className="text-xs text-muted-foreground">Moved where safe. {preview.visitConflicts} conflicting visit(s) stay attached to the archived venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Passport stamps</p><p className="mt-2 text-2xl font-semibold">{preview.passportStamps}</p><p className="text-xs text-muted-foreground">Moved to the official venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Journal links</p><p className="mt-2 text-2xl font-semibold">{preview.journals}</p><p className="text-xs text-muted-foreground">Moved to the official venue.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Tags</p><p className="mt-2 text-2xl font-semibold">{preview.tags}</p><p className="text-xs text-muted-foreground">Preserved where possible.</p></div>
              <div className="rounded-md border border-border bg-background/70 p-4"><p className="text-sm text-muted-foreground">Audit history</p><p className="mt-2 text-2xl font-semibold">Kept</p><p className="text-xs text-muted-foreground">Merge and archive activity remain available to admins.</p></div>
            </div>
            <form action={mergeDuplicateVenue} className="mt-6 space-y-4 rounded-md border border-destructive/30 bg-destructive/10 p-4">
              <input type="hidden" name="sourceVenueId" value={preview.sourceVenue.id} />
              <input type="hidden" name="targetVenueId" value={preview.targetVenue.id} />
              {params?.candidateId ? <input type="hidden" name="candidateId" value={params.candidateId} /> : null}
              <label className="grid gap-2 text-sm font-semibold">
                Merge reason
                <textarea name="mergeReason" className="min-h-24 rounded-md border border-input bg-background/90 px-3 py-2 text-sm" placeholder="Why is this venue a duplicate?" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Type this exact confirmation before merging
                <span className="rounded-md border border-border bg-background/80 p-3 text-xs font-normal text-muted-foreground">{confirmation}</span>
                <input name="confirmation" className="h-10 rounded-md border border-input bg-background/90 px-3 text-sm" required />
              </label>
              <button className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground" type="submit">
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
