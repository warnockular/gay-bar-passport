import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ExternalLink, MapPin, ShieldCheck, Stamp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getVenueBySlug, listFavoriteVenueIds } from "@/services/venues";

type VenueDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function label(value: string) {
  return value
    .split("_")
    .map((part) => (part.toLowerCase() === "lgbtq" ? "LGBTQ" : part.slice(0, 1).toUpperCase() + part.slice(1)))
    .join(" ");
}

function verificationMessage(status: string, claimedBy?: string | null) {
  if (claimedBy) return "Owner linked";
  if (status === "admin_verified") return "Admin Verified";
  if (status === "owner_verified") return "Owner Verified";
  if (status === "community_verified") return "Community Verified";
  return "Not Yet Verified";
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

  return (
    <section className="container py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <VenueImagePreview imageUrl={venue.image_url} alt={`${venue.name} travel preview`} className="h-[26rem]" />
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{label(venue.category)}</Badge>
              <Badge>{verificationMessage(venue.verification_status, venue.claimed_by)}</Badge>
            </div>
            <h1 className="mt-4 font-serif text-5xl font-semibold">{venue.name}</h1>
            <p className="mt-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-rose" aria-hidden="true" />
              {venue.neighborhood ? `${venue.neighborhood}, ` : ""}
              <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>
                {venue.city}
              </Link>
              <span>,</span>
              <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>
                {venue.country}
              </Link>
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
          <div className="flex flex-wrap gap-2">
            {venue.tags.map((tag) => (
              <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
                <Badge className="normal-case tracking-normal">{tag.name}</Badge>
              </Link>
            ))}
          </div>
        </div>
        <Card className="h-fit space-y-5 bg-card/90 p-5">
          <FavoriteButton venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={Boolean(user)} />
          <Link className={cn(buttonVariants({ variant: "secondary" }), "w-full")} href={user ? `/venues/${venue.slug}/log-visit` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/log-visit`)}`}>
            <Stamp className="h-4 w-4" aria-hidden="true" />
            Log visit
          </Link>
          <Link className={cn(buttonVariants({ variant: "outline" }), "w-full")} href={user ? `/venues/${venue.slug}/claim` : `/auth/sign-in?next=${encodeURIComponent(`/venues/${venue.slug}/claim`)}`}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Claim this venue
          </Link>
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
              {venue.address ? <p>{venue.address}</p> : null}
              {venue.neighborhood ? <p className="text-muted-foreground">{venue.neighborhood}</p> : null}
              <p className="text-muted-foreground">{venue.city}, {venue.country}</p>
            </div>
          </div>
          {venue.latitude && venue.longitude ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Coordinates</p>
              <p className="mt-2 text-sm">
                {venue.latitude}, {venue.longitude}
              </p>
            </div>
          ) : null}
          {venue.website_url ? (
            <a className={cn(buttonVariants(), "w-full")} href={venue.website_url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Visit website
            </a>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
