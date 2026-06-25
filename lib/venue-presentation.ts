import { venueCategoryLabel } from "@/lib/venue-categories";
import {
  formatVenueActionLocation,
  formatVenueHeaderLocation,
  formatVenueSidebarLocation
} from "@/lib/venue-location-display";

type VenuePresentationTag = {
  name: string;
  slug: string;
};

type VenuePresentationInput = {
  address?: string | null;
  category: string;
  city?: string | null;
  city_slug?: string | null;
  claimed_by?: string | null;
  country?: string | null;
  country_slug?: string | null;
  name: string;
  neighborhood?: string | null;
  opening_hours?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  region?: string | null;
  review_status?: string | null;
  tags?: VenuePresentationTag[] | null;
  verification_status?: string | null;
  website_url?: string | null;
};

function clean(value?: string | null) {
  return value?.trim() || "";
}

function humanizeEnum(value?: string | null) {
  return clean(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeUrl(url?: string | null) {
  const value = clean(url);
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function websiteLabel(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname || url;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/^www\./, "");
  }
}

function formatPhoneLabel(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
}

export function getPublicVenueTitle(venue: VenuePresentationInput) {
  return clean(venue.name) || "Venue";
}

export function getPublicVenueCategory(venue: VenuePresentationInput) {
  return {
    label: venueCategoryLabel(venue.category),
    value: venue.category
  };
}

export function getPublicVenueVerification(venue: VenuePresentationInput) {
  if (venue.claimed_by) {
    return {
      label: "Owner Verified",
      description: "This venue has an approved owner profile."
    };
  }

  if (venue.verification_status === "admin_verified") {
    return {
      label: "Admin Verified",
      description: "This venue has been reviewed by the Gay Bar Passport admin team."
    };
  }

  if (venue.verification_status === "owner_verified") {
    return {
      label: "Owner Verified",
      description: "This venue has been verified through an owner review."
    };
  }

  if (venue.verification_status === "community_verified") {
    return {
      label: "Community Verified",
      description: "This venue has been supported by community signals."
    };
  }

  return {
    label: "Not Yet Verified",
    description: "Venue owners can request admin review."
  };
}

export function getPublicVenueReviewStatus(venue: VenuePresentationInput) {
  return humanizeEnum(venue.review_status);
}

export function getPublicVenueTags(venue: VenuePresentationInput) {
  return venue.tags ?? [];
}

export function getPublicVenueLocation(venue: VenuePresentationInput) {
  return {
    actionSubtitle: formatVenueActionLocation(venue),
    headerParts: formatVenueHeaderLocation(venue),
    sidebar: formatVenueSidebarLocation(venue)
  };
}

export function getPublicVenueWebsite(venue: VenuePresentationInput) {
  const url = normalizeUrl(venue.website_url);
  if (!url) return null;

  return {
    label: websiteLabel(url),
    url
  };
}

export function getPublicVenuePhone(venue: VenuePresentationInput) {
  const value = clean(venue.phone);
  if (!value) return null;

  const normalized = value.replace(/[^\d+]/g, "");

  return {
    href: normalized ? `tel:${normalized}` : null,
    label: formatPhoneLabel(value),
    raw: value
  };
}

export function getPublicVenueHours(venue: VenuePresentationInput) {
  return clean(venue.opening_hours) || null;
}

export function getPublicVenuePresentation(venue: VenuePresentationInput) {
  return {
    category: getPublicVenueCategory(venue),
    hours: getPublicVenueHours(venue),
    location: getPublicVenueLocation(venue),
    phone: getPublicVenuePhone(venue),
    reviewStatus: getPublicVenueReviewStatus(venue),
    tags: getPublicVenueTags(venue),
    title: getPublicVenueTitle(venue),
    verification: getPublicVenueVerification(venue),
    website: getPublicVenueWebsite(venue)
  };
}
