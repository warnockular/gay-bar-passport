import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Navigation, ShieldCheck, Stamp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VenueCard, VenueDescription, VenueHeader, VenueSidebar } from "@/features/venues/presentation";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { VenueShareButton } from "@/features/venues/venue-share-button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getPublicVenuePresentation } from "@/lib/venue-presentation";
import { getVenueBySlug, listFavoriteVenueIds, listNearbyVenues } from "@/services/venues";

type VenueDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function directionsUrl(venue: NonNullable<Awaited<ReturnType<typeof getVenueBySlug>>>) {
  if (venue.latitude !== null && venue.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.latitude},${venue.longitude}`)}`;
  }

  const hasAddress = Boolean(venue.address?.trim());
  const addressQuery = [venue.address, venue.city, venue.region, venue.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  if (!hasAddress || !addressQuery) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery)}`;
}

export async function generateMetadata({ params }: VenueDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return { title: "Venue | Gay Bar Passport" };
  return {
    title: `${venue.name} in ${venue.city} | Gay Bar Passport`,
    description: venue.description ?? `Explore ${venue.name}, an LGBTQ+ venue in ${venue.city}, ${venue.country}.`
  };
}

export default async function VenueDetailPage({ params }: VenueDetailPageProps) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const user = await getCurrentUser();
  const [favoriteIds, nearbyVenues] = await Promise.all([
    listFavoriteVenueIds(user?.id),
    listNearbyVenues(venue)
  ]);
  const directions = directionsUrl(venue);
  const presentation = getPublicVenuePresentation(venue);

  return (
    <section className="container py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <VenueHeader venue={venue} />
          <VenueDescription description={venue.description} />
        </div>
        <VenueSidebar
          className="h-fit space-y-5 bg-card/90 p-5 lg:sticky lg:top-24"
          hideContactWebsite={Boolean(presentation.website)}
          venue={venue}
          actions={(
            <>
              <FavoriteButton buttonClassName="w-full" venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={Boolean(user)} />
              <Link className={cn(buttonVariants({ variant: "secondary" }), "w-full")} href={user ? `/venues/${venue.slug}/log-visit` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/log-visit`)}`}>
                <Stamp className="h-4 w-4" aria-hidden="true" />
                Log visit
              </Link>
              {presentation.website ? (
                <a className={cn(buttonVariants(), "w-full")} href={presentation.website.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Visit Website
                </a>
              ) : null}
              {directions ? (
                <a className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={directions} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Get Directions
                </a>
              ) : null}
              <VenueShareButton path={`/venues/${venue.slug}`} title={`${presentation.title} | Gay Bar Passport`} />
              <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={user ? `/venues/${venue.slug}/claim` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/claim`)}`}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Claim this venue
              </Link>
            </>
          )}
        />
      </div>
      {nearbyVenues.length ? (
        <section className="mt-12 border-t border-border pt-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Nearby Venues</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">Keep exploring nearby.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {nearbyVenues.map((nearbyVenue) => (
              <VenueCard
                key={nearbyVenue.id}
                distanceMiles={nearbyVenue.distanceMiles}
                favoriteIds={favoriteIds}
                isSignedIn={Boolean(user)}
                mode="compact"
                showDescription={false}
                traitLimit={3}
                venue={nearbyVenue}
              />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
