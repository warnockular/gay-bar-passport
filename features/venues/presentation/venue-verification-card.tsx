import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueVerificationCardProps = {
  venue: VenuePresentationInput;
};

export function VenueVerificationCard({ venue }: VenueVerificationCardProps) {
  const { verification } = getPublicVenuePresentation(venue);

  return (
    <div className="rounded-md border border-border bg-background/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verification</p>
      <p className="mt-2 text-sm font-semibold">{verification.label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{verification.description}</p>
    </div>
  );
}
