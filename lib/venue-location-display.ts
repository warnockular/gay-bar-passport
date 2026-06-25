type VenueLocationInput = {
  address?: string | null;
  city?: string | null;
  country?: string | null;
  neighborhood?: string | null;
  postal_code?: string | null;
  region?: string | null;
};

function cleanPart(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

function normalized(value?: string | null) {
  return cleanPart(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function includesPart(container: string, part?: string | null) {
  const normalizedPart = normalized(part);
  return Boolean(normalizedPart) && normalized(container).includes(normalizedPart);
}

function uniqueParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();
  return parts.flatMap((part) => {
    const value = cleanPart(part);
    const key = normalized(value);
    if (!value || seen.has(key)) return [];
    seen.add(key);
    return [value];
  });
}

export function formatVenueHeaderLocation(venue: VenueLocationInput) {
  return uniqueParts([venue.neighborhood, venue.city, venue.region, venue.country]);
}

export function formatVenueActionLocation(venue: VenueLocationInput) {
  return formatVenueHeaderLocation(venue).join(", ");
}

export function formatVenueSidebarLocation(venue: VenueLocationInput) {
  const address = cleanPart(venue.address);
  const postalCode = cleanPart(venue.postal_code);
  const primaryLine = address
    ? [address, postalCode && !includesPart(address, postalCode) ? postalCode : null].filter(Boolean).join(", ")
    : "";

  const secondaryLine = uniqueParts([venue.neighborhood, venue.city, venue.region, venue.country])
    .filter((part) => !primaryLine || !includesPart(primaryLine, part))
    .join(", ");

  return {
    primaryLine,
    secondaryLine
  };
}
