import type { ImportAdapter, ImportedVenueCandidate } from "@/services/imports/types";
import type { Json } from "@/types/database";

type OpenStreetMapTags = Record<string, string | undefined>;

export type OpenStreetMapRawElement = {
  _searchContext?: {
    centerLatitude?: number;
    centerLongitude?: number;
    city?: string;
    country?: string;
    includeBroadResults?: boolean;
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
  includeBroadResults?: boolean;
  neighborhood?: string;
  region: string;
  searchTerm: string;
};

export type OpenStreetMapSearchResult = {
  candidates: ImportedVenueCandidate[];
  error?: string;
};

const USER_AGENT = "Gay Bar Passport admin import (https://gay-bar-passport.vercel.app)";
const MINIMUM_RELEVANCE_SCORE = 45;
const QUEER_KEYWORDS = ["gay", "queer", "lesbian", "lgbt", "lgbtq", "trans", "pride", "leather", "bear", "drag"];
const GENERIC_SEARCH_TERMS = new Set(["bar", "bars", "club", "clubs", "cafe", "cafes", "restaurant", "restaurants", "venue", "venues", "nightlife"]);
const NIGHTLIFE_AMENITIES = ["bar", "pub", "nightclub", "community_centre"];

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

function osmCategoryLabel(tags: OpenStreetMapTags | undefined) {
  return compactJoin([
    tagValue(tags, "amenity") ? `amenity=${tagValue(tags, "amenity")}` : null,
    tagValue(tags, "shop") ? `shop=${tagValue(tags, "shop")}` : null,
    tagValue(tags, "leisure") ? `leisure=${tagValue(tags, "leisure")}` : null,
    tagValue(tags, "tourism") ? `tourism=${tagValue(tags, "tourism")}` : null,
    tagValue(tags, "historic") ? `historic=${tagValue(tags, "historic")}` : null
  ]) || "Uncategorized";
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

function searchableText(tags: OpenStreetMapTags | undefined) {
  return Object.entries(tags ?? {})
    .map(([key, value]) => `${key} ${value ?? ""}`)
    .join(" ")
    .toLowerCase();
}

function meaningfulSearchTokens(searchTerm?: string | null) {
  return (searchTerm ?? "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !GENERIC_SEARCH_TERMS.has(token));
}

function distanceInKilometers(fromLatitude?: number | null, fromLongitude?: number | null, toLatitude?: number | null, toLongitude?: number | null) {
  if (fromLatitude === null || fromLatitude === undefined || fromLongitude === null || fromLongitude === undefined || toLatitude === null || toLatitude === undefined || toLongitude === null || toLongitude === undefined) {
    return null;
  }
  const radius = 6371;
  const latitudeDelta = (toLatitude - fromLatitude) * Math.PI / 180;
  const longitudeDelta = (toLongitude - fromLongitude) * Math.PI / 180;
  const fromRadians = fromLatitude * Math.PI / 180;
  const toRadians = toLatitude * Math.PI / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(fromRadians) * Math.cos(toRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreOsmRelevance(element: OpenStreetMapRawElement, searchTerm?: string | null) {
  const tags = element.tags;
  const context = element._searchContext ?? {};
  const reasons: string[] = [];
  const name = tagValue(tags, "name", "name:en")?.toLowerCase() ?? "";
  const website = tagValue(tags, "website", "contact:website")?.toLowerCase() ?? "";
  const text = searchableText(tags);
  const amenity = tagValue(tags, "amenity");
  const shop = tagValue(tags, "shop");
  const tourism = tagValue(tags, "tourism");
  const historic = tagValue(tags, "historic");
  const isNightlifeOrCommunity = NIGHTLIFE_AMENITIES.includes(amenity ?? "") || shop === "books";
  const isGenericFood = ["restaurant", "cafe"].includes(amenity ?? "");
  const latitude = element.lat ?? element.center?.lat ?? null;
  const longitude = element.lon ?? element.center?.lon ?? null;
  const distance = distanceInKilometers(context.centerLatitude, context.centerLongitude, latitude, longitude);
  let score = 0;

  const nameKeyword = QUEER_KEYWORDS.find((keyword) => name.includes(keyword));
  if (nameKeyword) {
    score += 45;
    reasons.push(`Name contains "${nameKeyword}"`);
  }

  const tagKeyword = QUEER_KEYWORDS.find((keyword) => text.includes(keyword));
  if (tagKeyword) {
    score += 40;
    reasons.push(`OSM tags mention "${tagKeyword}"`);
  }

  const websiteKeyword = QUEER_KEYWORDS.find((keyword) => website.includes(keyword));
  if (websiteKeyword) {
    score += 35;
    reasons.push(`Website mentions "${websiteKeyword}"`);
  }

  const searchToken = meaningfulSearchTokens(searchTerm).find((token) => name.includes(token) || text.includes(token) || website.includes(token));
  if (searchToken) {
    score += 20;
    reasons.push(`Matches search term "${searchToken}"`);
  }

  if (isNightlifeOrCommunity) {
    score += 30;
    reasons.push(`${osmCategoryLabel(tags)} is a nightlife or community venue`);
  } else if (isGenericFood) {
    score += 8;
    reasons.push(`${osmCategoryLabel(tags)} may be relevant if queer-specific`);
  }

  if (distance !== null && distance <= 0.8 && isNightlifeOrCommunity) {
    score += 25;
    reasons.push("Very close to the searched neighborhood");
  } else if (distance !== null && distance <= 1.6 && isNightlifeOrCommunity) {
    score += 15;
    reasons.push("Near the searched neighborhood");
  }

  if ((tourism || historic) && !nameKeyword && !tagKeyword && !websiteKeyword) {
    score -= 20;
  }

  return {
    level: score >= 75 ? "High relevance" : score >= MINIMUM_RELEVANCE_SCORE ? "Medium relevance" : "Low relevance",
    reasons: reasons.length ? reasons : ["No queer-specific OSM signal found"],
    score: Math.max(0, Math.min(score, 100))
  };
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
  const relevance = scoreOsmRelevance(element, context.searchTerm);

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
      osm_category: osmCategoryLabel(tags),
      osm_tags: tags as unknown as Json,
      osm_type: element.type,
      provider: "overpass",
      relevance_level: relevance.level,
      relevance_reasons: relevance.reasons,
      relevance_score: relevance.score,
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
  const searchTokenRegex = meaningfulSearchTokens(searchTerm).map(overpassEscape).join("|");
  const queerRegex = QUEER_KEYWORDS.map(overpassEscape).join("|");
  const exactNameQueries = escapedTerm
    ? `
      node(${boundingBox})["name"~"${escapedTerm}",i];
      way(${boundingBox})["name"~"${escapedTerm}",i];
      relation(${boundingBox})["name"~"${escapedTerm}",i];
    `
    : "";
  const tokenNameQueries = searchTokenRegex
    ? `
      node(${boundingBox})["name"~"${searchTokenRegex}",i];
      way(${boundingBox})["name"~"${searchTokenRegex}",i];
      relation(${boundingBox})["name"~"${searchTokenRegex}",i];
    `
    : "";
  return `
    [out:json][timeout:25];
    (
      ${exactNameQueries}
      ${tokenNameQueries}
      node(${boundingBox})["name"~"${queerRegex}",i];
      way(${boundingBox})["name"~"${queerRegex}",i];
      relation(${boundingBox})["name"~"${queerRegex}",i];
      node(${boundingBox})["description"~"${queerRegex}",i];
      way(${boundingBox})["description"~"${queerRegex}",i];
      relation(${boundingBox})["description"~"${queerRegex}",i];
      node(${boundingBox})["website"~"${queerRegex}",i];
      way(${boundingBox})["website"~"${queerRegex}",i];
      relation(${boundingBox})["website"~"${queerRegex}",i];
      node(${boundingBox})["operator"~"${queerRegex}",i];
      way(${boundingBox})["operator"~"${queerRegex}",i];
      relation(${boundingBox})["operator"~"${queerRegex}",i];
      node(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|community_centre",i];
      way(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|community_centre",i];
      relation(${boundingBox})["amenity"~"bar|pub|nightclub|restaurant|cafe|community_centre",i];
      node(${boundingBox})["shop"~"books",i];
      way(${boundingBox})["shop"~"books",i];
      relation(${boundingBox})["shop"~"books",i];
      node(${boundingBox})["lgbtq"];
      way(${boundingBox})["lgbtq"];
      relation(${boundingBox})["lgbtq"];
      node(${boundingBox})["gay"];
      way(${boundingBox})["gay"];
      relation(${boundingBox})["gay"];
    );
    out center 75;
  `;
}

function searchContext(input: OpenStreetMapSearchInput, centerLatitude: number, centerLongitude: number) {
  return {
    centerLatitude,
    centerLongitude,
    city: input.city,
    country: input.country,
    includeBroadResults: input.includeBroadResults,
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
    const centerLatitude = (Number(south) + Number(north)) / 2;
    const centerLongitude = (Number(west) + Number(east)) / 2;
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
    const context = searchContext(input, centerLatitude, centerLongitude);
    const seen = new Set<string>();
    const elements = (payload.elements ?? [])
      .filter((element) => element.tags?.name)
      .map((element) => ({ ...element, _searchContext: context }))
      .filter((element) => input.includeBroadResults || scoreOsmRelevance(element, input.searchTerm).score >= MINIMUM_RELEVANCE_SCORE)
      .filter((element) => {
        const key = `${element.type}/${element.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => scoreOsmRelevance(right, input.searchTerm).score - scoreOsmRelevance(left, input.searchTerm).score);

    return { candidates: elements.map(mapOpenStreetMapElementToCandidate) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "OpenStreetMap search failed.";
    return { candidates: [], error: message };
  }
}
