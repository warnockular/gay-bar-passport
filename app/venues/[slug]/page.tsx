import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ExternalLink, MapPin, Navigation, Phone, ShieldCheck, Stamp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { VenueShareButton } from "@/features/venues/venue-share-button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { venueCategoryLabel } from "@/lib/venue-categories";
import { getVenueBySlug, listFavoriteVenueIds } from "@/services/venues";

type VenueDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function verificationMessage(status: string, claimedBy?: string | null) {
  if (claimedBy) return "Owner linked";
  if (status === "admin_verified") return "Admin Verified";
  if (status === "owner_verified") return "Owner Verified";
  if (status === "community_verified") return "Community Verified";
  return "Not Yet Verified";
}

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

function phoneUrl(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : null;
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
  const favoriteIds = await listFavoriteVenueIds(user?.id);
  const directions = directionsUrl(venue);
  const locationLabel = [venue.neighborhood, venue.city, venue.region, venue.country].filter(Boolean).join(", ");
  const postalAddress = [venue.address, venue.postal_code].filter(Boolean).join(", ");
  const phoneLink = venue.phone ? phoneUrl(venue.phone) : null;

  return (
    <section className="container py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <VenueImagePreview imageUrl={venue.image_url} alt={`${venue.name} travel preview`} className="h-72 sm:h-96 lg:h-[26rem]" />
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{venueCategoryLabel(venue.category)}</Badge>
              <Badge>{verificationMessage(venue.verification_status, venue.claimed_by)}</Badge>
              {venue.tags.map((tag) => (
                <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
                  <Badge className="normal-case tracking-normal">{tag.name}</Badge>
                </Link>
              ))}
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">{venue.name}</h1>
            <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-rose" aria-hidden="true" />
              {venue.neighborhood ? <span>{venue.neighborhood}</span> : null}
              {venue.neighborhood ? <span aria-hidden="true">·</span> : null}
              <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>{venue.city}</Link>
              {venue.region ? <span>{venue.region}</span> : null}
              <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>{venue.country}</Link>
            </p>
          </div>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{venue.description}</p>
          {venue.opening_hours ? (
            <div className="flex max-w-3xl items-start gap-3 rounded-md border border-border bg-card/80 p-4 text-sm">
              <Clock className="mt-0.5 h-4 w-4 text-sage" aria-hidden="true" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="mt-1 text-muted-foreground">{venue.opening_hours}</p>
              </div>
            </div>
          ) : null}
        </div>
        <Card className="h-fit space-y-5 bg-card/90 p-5 lg:sticky lg:top-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Traveler Actions</p>
            <p className="mt-2 text-sm text-muted-foreground">{locationLabel}</p>
          </div>
          <div className="grid gap-3">
            <FavoriteButton buttonClassName="w-full" venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={Boolean(user)} />
            <Link className={cn(buttonVariants({ variant: "secondary" }), "w-full")} href={user ? `/venues/${venue.slug}/log-visit` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/log-visit`)}`}>
              <Stamp className="h-4 w-4" aria-hidden="true" />
              Log visit
            </Link>
            {venue.website_url ? (
              <a className={cn(buttonVariants(), "w-full")} href={venue.website_url} target="_blank" rel="noreferrer">
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
            <VenueShareButton path={`/venues/${venue.slug}`} title={`${venue.name} | Gay Bar Passport`} />
            <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={user ? `/venues/${venue.slug}/claim` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/claim`)}`}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Claim this venue
            </Link>
          </div>
          <div className="rounded-md border border-border bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verification</p>
            <p className="mt-2 text-sm font-semibold">
              {verificationMessage(venue.verification_status, venue.claimed_by)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {venue.claimed_by ? "This venue has an approved owner profile." : venue.verification_status === "admin_verified" ? "This venue has been reviewed by the Gay Bar Passport admin team." : "Venue owners can request admin review."}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
            <div className="mt-2 space-y-1 text-sm">
              {postalAddress ? <p>{postalAddress}</p> : null}
              {venue.neighborhood ? <p className="text-muted-foreground">{venue.neighborhood}</p> : null}
              <p className="text-muted-foreground">{[venue.city, venue.region, venue.country].filter(Boolean).join(", ")}</p>
            </div>
          </div>
          {venue.phone ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
              {phoneLink ? (
                <a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={phoneLink}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {venue.phone}
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{venue.phone}</p>
              )}
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
