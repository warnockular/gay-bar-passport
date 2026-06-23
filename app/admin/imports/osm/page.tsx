import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { importSelectedOpenStreetMapToStaging } from "@/features/admin/actions";
import { countryOptions, getCityOptions } from "@/lib/location-options";
import { venueCategoryLabel } from "@/lib/venue-categories";
import { listAdminVenues } from "@/services/admin";
import { searchOpenStreetMapCandidates, type OpenStreetMapSearchResult } from "@/services/imports/adapters/openstreetmap";
import type { ImportedVenueCandidate } from "@/services/imports/types";

type OpenStreetMapImportPageProps = {
  searchParams?: Promise<{
    city?: string;
    country?: string;
    error?: string;
    neighborhood?: string;
    region?: string;
    searchTerm?: string;
  }>;
};

function normalize(value?: string | null) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function domain(value?: string | null) {
  if (!value) return "";
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname.replace(/^www\./, "");
  } catch {
    return normalize(value);
  }
}

function duplicateHint(candidate: ImportedVenueCandidate, venues: Awaited<ReturnType<typeof listAdminVenues>>) {
  const candidateName = normalize(candidate.name);
  const candidateCity = normalize(candidate.city);
  const candidateWebsite = domain(candidate.websiteUrl);
  const candidateAddress = normalize(candidate.address);
  let bestScore = 0;
  let bestVenue = "";

  for (const venue of venues) {
    let score = 0;
    if (candidateName && candidateName === normalize(venue.name)) score += 45;
    if (candidateCity && candidateCity === normalize(venue.city)) score += 15;
    if (candidateWebsite && candidateWebsite === domain(venue.website_url)) score += 35;
    if (candidateAddress && candidateAddress === normalize(venue.address)) score += 30;
    if (score > bestScore) {
      bestScore = Math.min(score, 100);
      bestVenue = venue.name;
    }
  }

  if (bestScore >= 70) return `Likely duplicate: ${bestVenue} (${bestScore}%)`;
  if (bestScore >= 35) return `Possible match: ${bestVenue} (${bestScore}%)`;
  return "No obvious duplicate signal";
}

function rawSelectionValue(candidate: ImportedVenueCandidate) {
  return JSON.stringify(candidate.rawData);
}

export default async function AdminOpenStreetMapImportPage({ searchParams }: OpenStreetMapImportPageProps) {
  const params = (await searchParams) ?? {};
  const country = params.country ?? "United States";
  const region = params.region ?? "New York";
  const city = params.city ?? "New York City";
  const neighborhood = params.neighborhood ?? "Hell's Kitchen";
  const searchTerm = params.searchTerm ?? "gay bar";
  const shouldSearch = Boolean(params.searchTerm);
  const emptySearchResult: OpenStreetMapSearchResult = { candidates: [] };
  const [searchResult, venues] = await Promise.all([
    shouldSearch ? searchOpenStreetMapCandidates({ city, country, neighborhood, region, searchTerm }) : Promise.resolve(emptySearchResult),
    listAdminVenues()
  ]);
  const regionOptions = countryOptions.find((option) => option.name === country)?.regions ?? [];
  const cityOptions = getCityOptions(country, region);

  return (
    <div>
      <Badge>OpenStreetMap</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Preview OpenStreetMap venue candidates.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Search OpenStreetMap through Nominatim and Overpass, preview candidates, then stage selected results for admin review. Nothing is published.
      </p>

      {params.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          OpenStreetMap import failed: {params.error === "no-selection" ? "Select at least one result to import." : params.error}
        </p>
      ) : null}
      {searchResult.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          {searchResult.error}
        </p>
      ) : null}

      <Card className="mt-8 bg-card/90 p-6">
        <h2 className="font-serif text-3xl font-semibold">Search OpenStreetMap</h2>
        <form className="mt-5 grid gap-4 md:grid-cols-2" method="get">
          <label className="grid gap-2 text-sm font-semibold">
            Country
            <select name="country" defaultValue={country} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              {countryOptions.map((option) => <option key={option.code} value={option.name}>{option.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Region / State
            <select name="region" defaultValue={region} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              <option value="">Choose one</option>
              {regionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            City
            <select name="city" defaultValue={city} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm">
              {cityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              {!cityOptions.includes(city) ? <option value={city}>{city}</option> : null}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Neighborhood optional
            <input name="neighborhood" defaultValue={neighborhood} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" />
          </label>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Search term
            <input name="searchTerm" defaultValue={searchTerm} className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" />
          </label>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
            Preview results
          </button>
        </form>
      </Card>

      {shouldSearch ? (
        <form action={importSelectedOpenStreetMapToStaging} className="mt-8 space-y-4">
          <input type="hidden" name="sourceName" value={`OpenStreetMap ${searchTerm} · ${[neighborhood, city, region].filter(Boolean).join(", ")}`} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-3xl font-semibold">Preview Results</h2>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
              Import Selected
            </button>
          </div>
          {searchResult.candidates.length ? (
            searchResult.candidates.map((candidate) => (
              <Card key={candidate.sourceId ?? candidate.name} className="bg-card/90 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <label className="flex min-w-0 flex-1 items-start gap-3">
                    <input className="mt-1 h-4 w-4 shrink-0" type="checkbox" name="selectedOsmPlace" value={rawSelectionValue(candidate)} />
                    <span className="min-w-0">
                      <span className="block font-serif text-2xl font-semibold">{candidate.name ?? "Unnamed OpenStreetMap result"}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{candidate.address ?? "No address provided"}</span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        {candidate.suggestedCategory ? <Badge>{venueCategoryLabel(candidate.suggestedCategory)}</Badge> : null}
                        <Badge>{duplicateHint(candidate, venues)}</Badge>
                      </span>
                    </span>
                  </label>
                  <div className="w-full text-sm text-muted-foreground md:w-80">
                    {candidate.websiteUrl ? <p className="break-words">Website: {candidate.websiteUrl}</p> : null}
                    {candidate.phone ? <p>Phone: {candidate.phone}</p> : null}
                    <p>Category guess: {candidate.suggestedCategory ? venueCategoryLabel(candidate.suggestedCategory) : "Needs review"}</p>
                    {candidate.sourceUrl ? (
                      <Link className="font-semibold text-primary hover:underline" href={candidate.sourceUrl} target="_blank">
                        Open OSM record
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No OpenStreetMap results returned for this search.</Card>
          )}
        </form>
      ) : null}

      <Link className="mt-8 inline-block text-sm font-semibold text-primary hover:underline" href="/admin/imports">
        Back to imports
      </Link>
    </div>
  );
}
