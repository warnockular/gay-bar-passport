import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueLocationCardProps = {
  venue: VenuePresentationInput;
};

export function VenueLocationCard({ venue }: VenueLocationCardProps) {
  const { location } = getPublicVenuePresentation(venue);

  if (!location.sidebar.addressLines.length && !location.sidebar.secondaryLine) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
      <div className="mt-2 space-y-1 text-sm">
        {location.sidebar.addressLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {location.sidebar.secondaryLine ? <p className="text-muted-foreground">{location.sidebar.secondaryLine}</p> : null}
      </div>
    </div>
  );
}
