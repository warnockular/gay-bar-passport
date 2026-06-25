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
import { getPublicVenuePresentation } from "@/lib/venue-presentation";
import { getVenueBySlug, listFavoriteVenueIds } from "@/services/venues";

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
  const favoriteIds = await listFavoriteVenueIds(user?.id);
  const directions = directionsUrl(venue);
  const presentation = getPublicVenuePresentation(venue);

  return (
    <section className="container py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <VenueImagePreview imageUrl={venue.image_url} alt={`${presentation.title} travel preview`} className="h-72 sm:h-96 lg:h-[26rem]" />
          <div className="space-y-4">
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
                    {part === venue.city ? (
                      <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>{part}</Link>
                    ) : part === venue.country ? (
                      <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>{part}</Link>
                    ) : (
                      <span>{part}</span>
                    )}
                  </span>
                ))}
              </p>
            ) : null}
            {presentation.tags.length ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Venue Traits</p>
                <div className="flex flex-wrap gap-2">
                  {presentation.tags.map((tag) => (
                    <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
                      <Badge className="bg-background normal-case tracking-normal">{tag.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{venue.description}</p>
          {presentation.hours ? (
            <div className="flex max-w-3xl items-start gap-3 rounded-md border border-border bg-card/80 p-4 text-sm">
              <Clock className="mt-0.5 h-4 w-4 text-sage" aria-hidden="true" />
              <div>
                <p className="font-semibold">Hours</p>
                <p className="mt-1 text-muted-foreground">{presentation.hours}</p>
              </div>
            </div>
          ) : null}
        </div>
        <Card className="h-fit space-y-5 bg-card/90 p-5 lg:sticky lg:top-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Traveler Actions</p>
            {presentation.location.actionSubtitle ? <p className="mt-2 text-sm text-muted-foreground">{presentation.location.actionSubtitle}</p> : null}
          </div>
          <div className="grid gap-3">
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
          </div>
          <div className="rounded-md border border-border bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Verification</p>
            <p className="mt-2 text-sm font-semibold">
              {presentation.verification.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {presentation.verification.description}
            </p>
          </div>
          {(presentation.location.sidebar.addressLines.length || presentation.location.sidebar.secondaryLine) ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Location</p>
              <div className="mt-2 space-y-1 text-sm">
                {presentation.location.sidebar.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {presentation.location.sidebar.secondaryLine ? <p className="text-muted-foreground">{presentation.location.sidebar.secondaryLine}</p> : null}
              </div>
            </div>
          ) : null}
          {presentation.phone ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
              {presentation.phone.href ? (
                <a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline" href={presentation.phone.href}>
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {presentation.phone.label}
                </a>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">{presentation.phone.label}</p>
              )}
            </div>
          ) : null}
          {presentation.website ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Website</p>
              <a className="mt-2 inline-flex items-center gap-2 break-all text-sm font-semibold text-primary hover:underline" href={presentation.website.url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                {presentation.website.label}
              </a>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
