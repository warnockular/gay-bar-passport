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

function splitAddressLines(address: string, postalCode: string) {
  const parts = address
    .split(",")
    .map((part) => cleanPart(part))
    .filter(Boolean);

  if (parts.length > 1) {
    const firstLine = parts[0];
    const secondLineParts = parts.slice(1);
    if (postalCode && !secondLineParts.some((part) => includesPart(part, postalCode))) {
      secondLineParts[secondLineParts.length - 1] = `${secondLineParts[secondLineParts.length - 1]} ${postalCode}`.trim();
    }
    return [firstLine, secondLineParts.join(", ")].filter(Boolean);
  }

  const firstLine = [address, postalCode && !includesPart(address, postalCode) ? postalCode : null].filter(Boolean).join(", ");
  return firstLine ? [firstLine] : [];
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
  const addressLines = address ? splitAddressLines(address, postalCode) : [];
  const addressText = addressLines.join(", ");
  const addressIncludesPlace = Boolean(
    addressText && [venue.city, venue.region, venue.country, venue.postal_code].some((part) => includesPart(addressText, part))
  );

  const secondaryLine = uniqueParts([venue.neighborhood, venue.city, venue.region, venue.country])
    .filter((part) => !addressText || !includesPart(addressText, part))
    .filter((part) => !addressIncludesPlace || includesPart(part, venue.neighborhood))
    .join(", ");

  return {
    addressLines,
    primaryLine: addressLines.join(", "),
    secondaryLine
  };
}
