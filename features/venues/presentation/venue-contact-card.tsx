import { ExternalLink, Phone } from "lucide-react";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueContactCardProps = {
  venue: VenuePresentationInput;
};

export function VenueContactCard({ venue }: VenueContactCardProps) {
  const { phone, website } = getPublicVenuePresentation(venue);

  if (!phone && !website) return null;

  return (
    <div className="space-y-4">
      {phone ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
          {phone.href ? (
            <a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={phone.href}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              {phone.label}
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{phone.label}</p>
          )}
        </div>
      ) : null}
      {website ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Website</p>
          <a className="mt-2 inline-flex items-center gap-2 break-all text-sm font-semibold text-primary hover:underline" href={website.url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            {website.label}
          </a>
        </div>
      ) : null}
    </div>
  );
}
