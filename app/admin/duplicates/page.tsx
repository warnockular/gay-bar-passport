import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { dismissDuplicateCandidate, generateVenueDuplicateCandidates } from "@/features/admin/actions";
import {
  listAdminVenues,
  listDuplicateCandidateFilterOptions,
  listDuplicateCandidates,
  listVenueDuplicateCandidates,
  type DuplicateCandidateFilters
} from "@/services/admin";

type AdminDuplicatesPageProps = {
  searchParams?: Promise<{
    city?: string;
    country?: string;
    created?: string;
    level?: string;
    sort?: string;
    updated?: string;
  }>;
};

const confidenceLabels = {
  high: "High Confidence",
  low: "Low Confidence",
  medium: "Medium Confidence"
};

const reasonLabels: Record<string, string> = {
  nearby_coordinates: "Nearby Coordinates",
  same_address: "Same Address",
  same_city: "Same City",
  same_website: "Same Website",
  similar_name: "Similar Name"
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function feedbackText(updated?: string, created?: string) {
  if (updated === "generated") return `Duplicate detection complete. ${created ?? "0"} new candidate${created === "1" ? "" : "s"} added.`;
  if (updated === "dismissed") return "Duplicate candidate dismissed.";
  if (updated === "merged") return "Duplicate merged and archived.";
  return null;
}

function sortValue(value?: string): DuplicateCandidateFilters["sort"] {
  if (value === "lowest" || value === "newest" || value === "oldest") return value;
  return "highest";
}

function levelValue(value?: string): DuplicateCandidateFilters["confidenceLevel"] {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "all";
}

export default async function AdminDuplicatesPage({ searchParams }: AdminDuplicatesPageProps) {
  const params = (await searchParams) ?? {};
  const filters: DuplicateCandidateFilters = {
    city: params.city || undefined,
    confidenceLevel: levelValue(params.level),
    country: params.country || undefined,
    sort: sortValue(params.sort)
  };
  const [detectedCandidates, filterOptions, importCandidates, venues] = await Promise.all([
    listVenueDuplicateCandidates(filters),
    listDuplicateCandidateFilterOptions(),
    listDuplicateCandidates(),
    listAdminVenues()
  ]);
  const activeVenues = venues.filter((venue) => !venue.archived_at);
  const feedback = feedbackText(params.updated, params.created);

  return (
    <div>
      <Badge>Duplicate Resolution</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue duplicate review.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Generate likely production duplicate pairs, review confidence signals, and archive duplicates only after previewing the merge impact.
      </p>
      {feedback ? (
        <p className="mt-4 flex items-center gap-2 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {feedback}
        </p>
      ) : null}

      <Card className="mt-8 bg-card/90 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Potential Duplicate Matches</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Candidate pairs are generated from active venues using name, address, website, location, and coordinate signals.
            </p>
          </div>
          <form action={generateVenueDuplicateCandidates}>
            <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
              <Search className="h-4 w-4" aria-hidden="true" />
              Generate Candidates
            </button>
          </form>
        </div>

        <form action="/admin/duplicates" className="mt-6 grid gap-4 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <label className="grid gap-2 text-sm font-semibold">
            Confidence
            <select name="level" defaultValue={filters.confidenceLevel ?? "all"} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="all">All confidence levels</option>
              <option value="high">High Confidence</option>
              <option value="medium">Medium Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            City
            <select name="city" defaultValue={filters.city ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="">All cities</option>
              {filterOptions.cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Country
            <select name="country" defaultValue={filters.country ?? ""} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="">All countries</option>
              {filterOptions.countries.map((country) => <option key={country} value={country}>{country}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Sort
            <select name="sort" defaultValue={filters.sort ?? "highest"} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="highest">Highest confidence</option>
              <option value="lowest">Lowest confidence</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button className="h-10 rounded-md border border-border bg-background/70 px-4 text-sm font-semibold hover:bg-muted" type="submit">Apply</button>
            <Link className="flex h-10 items-center rounded-md border border-border bg-background/70 px-4 text-sm font-semibold hover:bg-muted" href="/admin/duplicates">Reset</Link>
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {detectedCandidates.length ? detectedCandidates.map((candidate) => {
          const venueA = candidate.venueA;
          const venueB = candidate.venueB;
          if (!venueA || !venueB) return null;
          const reviewHref = `/admin/duplicates/compare?sourceVenueId=${venueA.id}&targetVenueId=${venueB.id}&candidateId=${candidate.id}`;

          return (
            <Card key={candidate.id} className="bg-card/90 p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{confidenceLabels[candidate.confidence_level]}</Badge>
                    <Badge className="bg-background/70">{candidate.confidence_score}/100</Badge>
                    <Badge className="bg-background/70">{venueA.city}, {venueA.country}</Badge>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {[venueA, venueB].map((venue, index) => (
                      <div key={venue.id} className="rounded-md border border-border bg-background/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Venue {index === 0 ? "A" : "B"}</p>
                        <h3 className="mt-2 font-serif text-2xl font-semibold">{venue.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{venue.address ?? "No address"} · {venue.city}, {venue.country}</p>
                        <p className="mt-2 break-all text-xs text-muted-foreground">{venue.website_url ?? "No website"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {candidate.match_reasons.map((reason) => (
                      <Badge key={reason} className="bg-terracotta/10 text-terracotta">{reasonLabels[reason] ?? label(reason)}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 lg:min-w-40">
                  <Link className="rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground" href={reviewHref}>
                    Review Match
                  </Link>
                  <form action={dismissDuplicateCandidate.bind(null, candidate.id)}>
                    <button className="w-full rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted" type="submit">
                      Dismiss
                    </button>
                  </form>
                </div>
              </div>
            </Card>
          );
        }) : (
          <Card className="bg-card/90 p-6 text-sm text-muted-foreground">
            No pending duplicate candidates match these filters. Generate candidates after new venues are added or loosen the filters.
          </Card>
        )}
      </div>

      <Card className="mt-10 bg-card/70 p-5">
        <h2 className="font-serif text-2xl font-semibold">Manual Merge</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Use this fallback when an admin knows two active venues are duplicates but no candidate was generated.
        </p>
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

      <div className="mt-10">
        <h2 className="font-serif text-3xl font-semibold">Import duplicate queue</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This remains separate from production venue duplicate candidates and is used for staged import records.
        </p>
        <div className="mt-5 space-y-4">
          {importCandidates.length ? importCandidates.map((candidate) => (
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
