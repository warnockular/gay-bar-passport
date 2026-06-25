import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";
import { VenueContactCard } from "./venue-contact-card";
import { VenueHoursCard } from "./venue-hours-card";
import { VenueLocationCard } from "./venue-location-card";
import { VenueVerificationCard } from "./venue-verification-card";

type VenueSidebarProps = {
  actions: ReactNode;
  className?: string;
  hideContactWebsite?: boolean;
  venue: VenuePresentationInput;
};

export function VenueSidebar({ actions, className, hideContactWebsite = false, venue }: VenueSidebarProps) {
  const { location } = getPublicVenuePresentation(venue);

  return (
    <Card className={className}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Traveler Actions</p>
        {location.actionSubtitle ? <p className="mt-2 text-sm text-muted-foreground">{location.actionSubtitle}</p> : null}
      </div>
      <div className="grid gap-3">{actions}</div>
      <VenueVerificationCard venue={venue} />
      <VenueLocationCard venue={venue} />
      <VenueContactCard hideWebsite={hideContactWebsite} venue={venue} />
      <VenueHoursCard venue={venue} />
    </Card>
  );
}
