import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";
import { VenueTraitGroup } from "./venue-trait-group";

type VenueHeaderVenue = VenuePresentationInput & {
  city_slug?: string | null;
  country_slug?: string | null;
  image_url?: string | null;
};

type VenueHeaderProps = {
  className?: string;
  imageClassName?: string;
  venue: VenueHeaderVenue;
};

export function VenueHeader({ className, imageClassName = "h-72 sm:h-96 lg:h-[26rem]", venue }: VenueHeaderProps) {
  const presentation = getPublicVenuePresentation(venue);

  return (
    <div className={className}>
      <VenueImagePreview imageUrl={venue.image_url} alt={`${presentation.title} travel preview`} className={imageClassName} />
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{presentation.category.label}</Badge>
          <Badge className="border-sage/40 bg-sage/10 text-charcoal">{presentation.verification.label}</Badge>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">{presentation.title}</h1>
        {presentation.location.headerParts.length ? (
          <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
            {presentation.location.headerParts.map((part, index) => (
              <span key={`${part}-${index}`} className="inline-flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                {part === venue.city && venue.city_slug && venue.country_slug ? (
                  <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>{part}</Link>
                ) : part === venue.country && venue.country_slug ? (
                  <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>{part}</Link>
                ) : (
                  <span>{part}</span>
                )}
              </span>
            ))}
          </p>
        ) : null}
        <VenueTraitGroup venue={venue} />
      </div>
    </div>
  );
}
