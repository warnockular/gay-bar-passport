import type { ImportAdapter, ImportedVenueCandidate } from "@/services/imports/types";
import type { Json } from "@/types/database";

type OpenStreetMapTags = Record<string, string | undefined>;

export type OpenStreetMapRawElement = {
  _searchContext?: {
    city?: string;
    country?: string;
    neighborhood?: string;
    region?: string;
    searchTerm?: string;
  };
  center?: {
    lat?: number;
    lon?: number;
  };
  id: number;
  lat?: number;
  lon?: number;
  tags?: OpenStreetMapTags;
  type: "node" | "way" | "relation";
};

type NominatimSearchResult = {
  boundingbox?: [string, string, string, string];
  display_name?: string;
  osm_id?: number;
  osm_type?: string;
};

export type OpenStreetMapSearchInput = {
  city: string;
  country: string;
  neighborhood?: string;
  region: string;
  searchTerm: string;
};

export type OpenStreetMapSearchResult = {
  candidates: ImportedVenueCandidate[];
  error?: string;
};

const USER_AGENT = "Gay Bar Passport admin import (https://gay-bar-passport.vercel.app)";

function tagValue(tags: OpenStreetMapTags | undefined, ...keys: string[]) {
  return keys.map((key) => tags?.[key]).find((value): value is string => Boolean(value?.trim())) ?? null;
}

function compactJoin(parts: Array<string | null | undefined>, separator = ", ") {
  return parts.map((part) => part?.trim()).filter(Boolean).join(separator);
}

function jsonRecord(value: OpenStreetMapRawElement): Record<string, Json | undefined> {
  return value as unknown as Record<string, Json | undefined>;
}

function normalizeOsmCountry(countryCode: string | null, fallbackCountry?: string) {
  if (!countryCode) return fallbackCountry ?? null;
  const countryMap: Record<string, string> = {
    ca: "Canada",
    us: "United States"
  };
  return countryMap[countryCode.toLowerCase()] ?? fallbackCountry ?? countryCode;
}

function osmUrl(element: OpenStreetMapRawElement) {
  return `https://www.openstreetmap.org/${element.type}/${element.id}`;
}

function mapOsmCategory(tags: OpenStreetMapTags | undefined) {
  const amenity = tagValue(tags, "amenity");
  const shop = tagValue(tags, "shop");
  const tourism = tagValue(tags, "tourism");
  const historic = tagValue(tags, "historic");

  if (amenity === "bar" || amenity === "pub") return "bar";
  if (amenity === "nightclub") return "club";
  if (amenity === "restaurant") return "restaurant";
  if (amenity === "cafe") return "cafe";
  if (amenity === "theatre") return "performance";
  if (amenity === "community_centre") return "community";
  if (shop === "books" || shop === "bookmaker") return "retail_bookstore";
  if (tourism === "attraction" || historic) return "cultural_historic_site";
  return null;
}

function inferSuggestedTags(tags: OpenStreetMapTags | undefined) {
  const suggested = new Set<string>();
  const lowerTags = Object.entries(tags ?? {})
    .map(([key, value]) => `${key}:${value ?? ""}`.toLowerCase())
    .join(" ");

  if (lowerTags.includes("karaoke")) suggested.add("Karaoke");
  if (lowerTags.includes("outdoor") || lowerTags.includes("patio") || lowerTags.includes("terrace")) suggested.add("Patio");
  if (lowerTags.includes("live_music")) suggested.add("Live music");
  if (lowerTags.includes("wheelchair:yes")) suggested.add("Accessible Entrance");
  if (lowerTags.includes("lgbt") || lowerTags.includes("gay")) suggested.add("Community");

  return Array.from(suggested);
}

export function mapOpenStreetMapElementToCandidate(element: OpenStreetMapRawElement): ImportedVenueCandidate {
  const tags = element.tags ?? {};
  const context = element._searchContext ?? {};
  const city = tagValue(tags, "addr:city", "is_in:city") ?? context.city ?? null;
  const region = tagValue(tags, "addr:state", "addr:province", "is_in:state") ?? context.region ?? null;
  const country = normalizeOsmCountry(tagValue(tags, "addr:country"), context.country);
  const postalCode = tagValue(tags, "addr:postcode", "postal_code");
  const address = compactJoin([
    compactJoin([tagValue(tags, "addr:housenumber"), tagValue(tags, "addr:street")], " "),
    tagValue(tags, "addr:unit"),
    city,
    region,
    postalCode,
    country
  ]);
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  const suggestedCategory = mapOsmCategory(tags);

  return {
    address: address || tagValue(tags, "addr:full") || null,
    category: tagValue(tags, "amenity", "shop", "tourism", "historic"),
    city,
    confidenceScore: null,
    country,
    description: tagValue(tags, "description", "note"),
    imageUrl: tagValue(tags, "image", "wikimedia_commons"),
    latitude,
    longitude,
    name: tagValue(tags, "name", "name:en"),
    neighborhood: tagValue(tags, "addr:suburb", "addr:neighbourhood", "neighbourhood") ?? context.neighborhood ?? null,
    openingHours: tagValue(tags, "opening_hours"),
    phone: tagValue(tags, "phone", "contact:phone"),
    postalCode,
    rawData: jsonRecord(element),
    region,
    source: "openstreetmap",
    sourceId: `${element.type}/${element.id}`,
    sourceMetadata: {
      imported_via: "openstreetmap",
      osm_id: String(element.id),
      osm_tags: tags as unknown as Json,
      osm_type: element.type,
      provider: "overpass",
      search_query: context.searchTerm ?? null
    },
    sourceUrl: osmUrl(element),
    suggestedCategory,
    suggestedTags: inferSuggestedTags(tags),
    websiteUrl: tagValue(tags, "website", "contact:website")
  };
}

export const openStreetMapImportAdapter: ImportAdapter = {
  parse(input) {
    const rawResults = (input.rawResults ?? []).filter((result): result is OpenStreetMapRawElement => {
      return Boolean(result && typeof result === "object" && "id" in result && "type" in result);
    });
    const candidates = rawResults.map(mapOpenStreetMapElementToCandidate);
    return { candidates, invalidCandidates: [], totalCount: rawResults.length };
  },
  sourceType: "openstreetmap"
};

function overpassEscape(value: string) {
  return value.replace(/[\\"]/g, "\\$&");
}

function buildOverpassQuery(boundingBox: string, searchTerm: string) {
  const escapedTerm = overpassEscape(searchTerm.trim());
  const nameFilter = escapedTerm ? `["name"~"${escapedTerm}",i]` : "";
  return `
    [out:json][timeout:25];
    (
      node(${boundingBox})${nameFilter};
      way(${boundingBox})${nameFilter};
      relation(${boundingBox})${nameFilter};
      node(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|theatre|community_centre",i];
      way(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|theatre|community_centre",i];
      relation(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|theatre|community_centre",i];
      node(${boundingBox})["lgbtq"];
      way(${boundingBox})["lgbtq"];
      relation(${boundingBox})["lgbtq"];
      node(${boundingBox})["gay"];
      way(${boundingBox})["gay"];
      relation(${boundingBox})["gay"];
    );
    out center 25;
  `;
}

function searchContext(input: OpenStreetMapSearchInput) {
  return {
    city: input.city,
    country: input.country,
    neighborhood: input.neighborhood,
    region: input.region,
    searchTerm: input.searchTerm
  };
}

export async function searchOpenStreetMapCandidates(input: OpenStreetMapSearchInput): Promise<OpenStreetMapSearchResult> {
  const locationQuery = compactJoin([input.neighborhood, input.city, input.region, input.country]);
  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("limit", "1");
  nominatimUrl.searchParams.set("q", locationQuery);

  try {
    const locationResponse = await fetch(nominatimUrl, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": USER_AGENT
      },
      next: { revalidate: 0 }
    });

    if (!locationResponse.ok) {
      return { candidates: [], error: `OpenStreetMap location lookup failed with status ${locationResponse.status}.` };
    }

    const locations = await locationResponse.json() as NominatimSearchResult[];
    const location = locations[0];
    if (!location?.boundingbox) {
      return { candidates: [], error: "OpenStreetMap could not find that location. Try a broader city or neighborhood." };
    }

    const [south, north, west, east] = location.boundingbox;
    const boundingBox = `${south},${west},${north},${east}`;
    const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
      body: new URLSearchParams({ data: buildOverpassQuery(boundingBox, input.searchTerm) }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT
      },
      method: "POST",
      next: { revalidate: 0 }
    });

    if (!overpassResponse.ok) {
      return { candidates: [], error: `OpenStreetMap venue search failed with status ${overpassResponse.status}.` };
    }

    const payload = await overpassResponse.json() as { elements?: OpenStreetMapRawElement[] };
    const context = searchContext(input);
    const seen = new Set<string>();
    const elements = (payload.elements ?? [])
      .filter((element) => element.tags?.name)
      .map((element) => ({ ...element, _searchContext: context }))
      .filter((element) => {
        const key = `${element.type}/${element.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return { candidates: elements.map(mapOpenStreetMapElementToCandidate) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenStreetMap search failed.";
    return { candidates: [], error: message };
  }
}
