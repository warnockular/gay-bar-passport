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
  const openingHours = place.currentOpeningHours?.weekdayDescriptions ?? place.currentOpeningHours?.weekday_text ?? [];
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
  parse() {
    // TODO: API key handling must live in server-only config and never in client bundles.
    // TODO: Add pagination support for Places Text Search / Nearby Search result pages.
    // TODO: Add rate limiting and quota-aware retries before any production import run.
    // TODO: Support incremental refresh by provider ID and last_seen_at.
    // TODO: Detect closed businesses via businessStatus before staging or approving.
    // TODO: Decide whether Google photo references are stored only as metadata or downloaded into moderated storage.
    // TODO: Feed Google-specific signals into duplicate scoring once real payloads are staged.
    // This placeholder intentionally does not call external APIs.
    return { candidates: [], invalidCandidates: [], totalCount: 0 };
  },
  sourceType: "google_places"
};
