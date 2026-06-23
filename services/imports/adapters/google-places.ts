import type { ImportAdapter, ImportedVenueCandidate } from "@/services/imports/types";
import type { Json } from "@/types/database";

type GooglePlacesAddressComponent = {
  longText?: string;
  long_name?: string;
  shortText?: string;
  short_name?: string;
  types?: string[];
};

type GooglePlacesPhoto = {
  authorAttributions?: Array<{ displayName?: string; uri?: string }>;
  heightPx?: number;
  name?: string;
  photo_reference?: string;
  widthPx?: number;
};

export type GooglePlacesRawResult = {
  addressComponents?: GooglePlacesAddressComponent[];
  businessStatus?: string;
  currentOpeningHours?: {
    weekdayDescriptions?: string[];
    weekday_text?: string[];
  };
  displayName?: {
    languageCode?: string;
    text?: string;
  };
  formattedAddress?: string;
  formattedPhoneNumber?: string;
  googleMapsUri?: string;
  id?: string;
  internationalPhoneNumber?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  nationalPhoneNumber?: string;
  photos?: GooglePlacesPhoto[];
  place_id?: string;
  primaryType?: string;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
    weekday_text?: string[];
  };
  types?: string[];
  userRatingCount?: number;
  websiteUri?: string;
};

export type GooglePlacesPhotoMetadata = {
  attribution: string | null;
  height: number | null;
  provider: "google_places";
  reference: string | null;
  width: number | null;
};

export type GooglePlacesCandidateMapper = (place: GooglePlacesRawResult) => ImportedVenueCandidate;

export type GooglePlacesSearchInput = {
  city: string;
  country: string;
  neighborhood?: string;
  region: string;
  searchTerm: string;
};

export type GooglePlacesSearchResult = {
  candidates: ImportedVenueCandidate[];
  error?: string;
};

function componentText(component: GooglePlacesAddressComponent) {
  return component.longText ?? component.long_name ?? component.shortText ?? component.short_name ?? null;
}

function addressComponent(place: GooglePlacesRawResult, type: string) {
  return place.addressComponents?.find((component) => component.types?.includes(type));
}

function mapGoogleTypeToCategory(type?: string | null) {
  const categoryMap: Record<string, ImportedVenueCandidate["suggestedCategory"]> = {
    bar: "bar",
    cafe: "cafe",
    cocktail_bar: "bar",
    night_club: "bar",
    restaurant: "restaurant"
  };
  return type ? categoryMap[type] ?? null : null;
}

function mapGooglePhotos(photos?: GooglePlacesPhoto[]): GooglePlacesPhotoMetadata[] {
  return (photos ?? []).map((photo) => ({
    attribution: photo.authorAttributions?.map((attribution) => attribution.displayName ?? attribution.uri).filter(Boolean).join(", ") || null,
    height: photo.heightPx ?? null,
    provider: "google_places",
    reference: photo.name ?? photo.photo_reference ?? null,
    width: photo.widthPx ?? null
  }));
}

function jsonRecord(value: GooglePlacesRawResult): Record<string, Json | undefined> {
  return value as unknown as Record<string, Json | undefined>;
}

export const mapGooglePlaceToCandidate: GooglePlacesCandidateMapper = (place) => {
  const locality = addressComponent(place, "locality") ?? addressComponent(place, "postal_town");
  const region = addressComponent(place, "administrative_area_level_1");
  const country = addressComponent(place, "country");
  const postalCode = addressComponent(place, "postal_code");
  const neighborhood = addressComponent(place, "neighborhood") ?? addressComponent(place, "sublocality");
  const openingHours = place.regularOpeningHours?.weekdayDescriptions
    ?? place.currentOpeningHours?.weekdayDescriptions
    ?? place.regularOpeningHours?.weekday_text
    ?? place.currentOpeningHours?.weekday_text
    ?? [];
  const placeTypes = [place.primaryType, ...(place.types ?? [])].filter((type): type is string => Boolean(type));
  const suggestedCategory = mapGoogleTypeToCategory(place.primaryType) ?? placeTypes.map(mapGoogleTypeToCategory).find(Boolean) ?? null;
  const photos = mapGooglePhotos(place.photos);

  return {
    address: place.formattedAddress ?? null,
    category: place.primaryType ?? null,
    city: componentText(locality ?? {}) ?? null,
    country: componentText(country ?? {}) ?? null,
    description: null,
    imageUrl: null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    name: place.displayName?.text ?? null,
    neighborhood: componentText(neighborhood ?? {}) ?? null,
    openingHours: openingHours.length ? openingHours.join("\n") : null,
    phone: place.internationalPhoneNumber ?? place.formattedPhoneNumber ?? place.nationalPhoneNumber ?? null,
    postalCode: componentText(postalCode ?? {}) ?? null,
    rawData: jsonRecord(place),
    region: componentText(region ?? {}) ?? null,
    source: "google_places",
    sourceId: place.id ?? place.place_id ?? null,
    sourceMetadata: {
      business_status: place.businessStatus ?? null,
      google_place_types: placeTypes,
      imported_via: "google_places",
      photo_count: photos.length,
      photos: photos as unknown as Json,
      user_rating_count: place.userRatingCount ?? null
    },
    sourceUrl: place.googleMapsUri ?? null,
    suggestedCategory,
    suggestedTags: [],
    websiteUrl: place.websiteUri ?? null
  };
};

export const googlePlacesImportAdapter: ImportAdapter = {
  parse(input) {
    // TODO: Add pagination support for Places Text Search / Nearby Search result pages.
    // TODO: Add rate limiting and quota-aware retries before any production import run.
    // TODO: Support incremental refresh by provider ID and last_seen_at.
    // TODO: Detect closed businesses via businessStatus before staging or approving.
    // TODO: Decide whether Google photo references are stored only as metadata or downloaded into moderated storage.
    // TODO: Feed Google-specific signals into duplicate scoring once real payloads are staged.
    const rawResults = (input.rawResults ?? []).filter((result): result is GooglePlacesRawResult => Boolean(result && typeof result === "object"));
    const candidates = rawResults.map(mapGooglePlaceToCandidate);
    return { candidates, invalidCandidates: [], totalCount: rawResults.length };
  },
  sourceType: "google_places"
};

export async function searchGooglePlacesCandidates(input: GooglePlacesSearchInput): Promise<GooglePlacesSearchResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return { candidates: [], error: "Missing GOOGLE_PLACES_API_KEY in the server environment." };

  const locationParts = [input.neighborhood, input.city, input.region, input.country].filter(Boolean).join(", ");
  const textQuery = `${input.searchTerm} in ${locationParts}`;
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    body: JSON.stringify({
      includedType: undefined,
      languageCode: "en",
      maxResultCount: 12,
      textQuery
    }),
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.addressComponents",
        "places.location",
        "places.googleMapsUri",
        "places.websiteUri",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.regularOpeningHours",
        "places.currentOpeningHours",
        "places.primaryType",
        "places.types",
        "places.photos",
        "places.businessStatus",
        "places.userRatingCount"
      ].join(",")
    },
    method: "POST",
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    let message = `Google Places request failed with status ${response.status}.`;
    try {
      const payload = await response.json() as { error?: { message?: string } };
      if (payload.error?.message) message = payload.error.message;
    } catch {
      // Keep the status-based admin message.
    }
    return { candidates: [], error: message };
  }

  const payload = await response.json() as { places?: GooglePlacesRawResult[] };
  const places = payload.places ?? [];
  return { candidates: places.map(mapGooglePlaceToCandidate) };
}
