"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ExternalLink, MapPin, Stamp } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";
import { VenueTraitGroup } from "./venue-trait-group";

export type VenueCardMode = "compact" | "default" | "featured" | "adminPreview" | "futureMapPopup";

type VenueCardVenue = VenuePresentationInput & {
  city_slug?: string | null;
  country_slug?: string | null;
  description?: string | null;
  id: string;
  image_url?: string | null;
  is_lgbtq_owned?: boolean | null;
  slug?: string | null;
};

type VenueCardProps = {
  actions?: ReactNode;
  className?: string;
  distanceMiles?: number | null;
  favoriteIds?: string[];
  href?: string;
  isSignedIn?: boolean;
  mode?: VenueCardMode;
  showDescription?: boolean;
  showFavorite?: boolean;
  showLogVisitAction?: boolean;
  showWebsiteAction?: boolean;
  traitLimit?: number;
  venue: VenueCardVenue;
};

function cardHref(venue: VenueCardVenue, href?: string) {
  if (href) return href;
  return venue.slug ? `/venues/${venue.slug}` : "#";
}

export function VenueCard({
  actions,
  className,
  distanceMiles,
  favoriteIds = [],
  href,
  isSignedIn = false,
  mode = "default",
  showDescription,
  showFavorite,
  showLogVisitAction,
  showWebsiteAction,
  traitLimit,
  venue
}: VenueCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const presentation = getPublicVenuePresentation(venue);
  const venueHref = cardHref(venue, href);
  const showImage = Boolean(venue.image_url) && !imageFailed;
  const isCompact = mode === "compact" || mode === "futureMapPopup";
  const isAdmin = mode === "adminPreview";
  const shouldShowDescription = showDescription ?? !isCompact;
  const shouldShowFavorite = showFavorite ?? (!isAdmin && mode !== "futureMapPopup");
  const shouldShowWebsiteAction = showWebsiteAction ?? (!isAdmin && !isCompact);
  const shouldShowLogVisitAction = showLogVisitAction ?? false;
  const maxTraits = traitLimit ?? (isCompact ? 3 : mode === "featured" ? 5 : 4);

  return (
    <Card className={cn("overflow-hidden bg-card/90", mode === "featured" && "border-sage/40", className)}>
      <div className={cn("grid gap-0", showImage && !isCompact && "md:grid-cols-[240px_1fr]", showImage && isCompact && "grid-cols-[112px_1fr]")}>
        {showImage ? (
          <Link href={venueHref} className={cn("relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isCompact ? "h-full min-h-32" : "h-56 sm:h-64 md:h-full")}>
            <span className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-4">
              <img src={venue.image_url ?? ""} alt={`${presentation.title} venue preview`} className="max-h-full max-w-full object-contain" onError={() => setImageFailed(true)} />
            </span>
          </Link>
        ) : null}
        <div className={cn("space-y-4", isCompact ? "p-4" : "p-5")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{presentation.category.label}</Badge>
                <Badge className="border-sage/40 bg-sage/10 text-charcoal">{presentation.verification.label}</Badge>
              </div>
              <Link href={venueHref} className={cn("mt-3 block font-serif font-semibold leading-tight hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isCompact ? "text-xl" : "text-2xl sm:text-3xl")}>
                {presentation.title}
              </Link>
              {presentation.location.headerParts.length ? (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
                  {presentation.location.headerParts.map((part, index) => (
                    <span key={`${venue.id}-${part}-${index}`} className="inline-flex items-center gap-2">
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
              {typeof distanceMiles === "number" ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
                  {distanceMiles < 0.1 ? "Less than 0.1 miles away" : `${distanceMiles.toFixed(1)} miles away`}
                </p>
              ) : null}
            </div>
            {shouldShowFavorite ? (
              <FavoriteButton venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={isSignedIn} />
            ) : null}
          </div>

          <VenueTraitGroup venue={venue} limit={maxTraits} />

          {shouldShowDescription && venue.description ? (
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{venue.description}</p>
          ) : null}

          {(shouldShowWebsiteAction && presentation.website) || shouldShowLogVisitAction || actions ? (
            <div className="flex flex-wrap gap-2">
              {shouldShowWebsiteAction && presentation.website ? (
                <a className={cn(buttonVariants({ variant: "outline" }), "text-sm")} href={presentation.website.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Visit Website
                </a>
              ) : null}
              {shouldShowLogVisitAction && venue.slug ? (
                <Link className={cn(buttonVariants({ variant: "secondary" }), "text-sm")} href={isSignedIn ? `/venues/${venue.slug}/log-visit` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/log-visit`)}`}>
                  <Stamp className="h-4 w-4" aria-hidden="true" />
                  Log Visit
                </Link>
              ) : null}
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
