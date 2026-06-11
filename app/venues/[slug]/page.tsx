import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getVenueBySlug, listFavoriteVenueIds } from "@/services/venues";

type VenueDetailPageProps = {
  params: Promise<{ slug: string }>;
};

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
          {venue.image_url ? (
            <div className="relative h-[26rem] overflow-hidden rounded-md border border-border">
              <Image src={venue.image_url} alt={`${venue.name} travel preview`} fill className="object-cover" priority sizes="(min-width: 1024px) 70vw, 100vw" />
            </div>
          ) : null}
          <div>
            <Badge>{venue.category}</Badge>
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Address</p>
            <p className="mt-2 text-sm">{venue.address ?? venue.neighborhood ?? `${venue.city}, ${venue.country}`}</p>
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
