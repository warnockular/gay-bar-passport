import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/features/venues/favorite-button";
import type { VenueWithTags } from "@/services/venues";

type VenueCardProps = {
  favoriteIds?: string[];
  isSignedIn?: boolean;
  venue: VenueWithTags;
};

export function VenueCard({ favoriteIds = [], isSignedIn = false, venue }: VenueCardProps) {
  return (
    <Card className="overflow-hidden bg-card/90">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        {venue.image_url ? (
          <Link href={`/venues/${venue.slug}`} className="relative block h-64 md:h-full">
            <Image src={venue.image_url} alt={`${venue.name} venue preview`} fill className="object-cover" sizes="(min-width: 768px) 240px, 100vw" />
          </Link>
        ) : null}
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/venues/${venue.slug}`} className="font-serif text-3xl font-semibold hover:text-primary">
                {venue.name}
              </Link>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-rose" aria-hidden="true" />
                <Link className="hover:text-primary" href={`/countries/${venue.country_slug}/${venue.city_slug}`}>
                  {venue.city}
                </Link>
                <span>,</span>
                <Link className="hover:text-primary" href={`/countries/${venue.country_slug}`}>
                  {venue.country}
                </Link>
              </p>
            </div>
            <FavoriteButton venueId={venue.id} initialIsFavorite={favoriteIds.includes(venue.id)} isSignedIn={isSignedIn} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{venue.category}</Badge>
            {venue.tags.map((tag) => (
              <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
                <Badge className="normal-case tracking-normal">{tag.name}</Badge>
              </Link>
            ))}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{venue.description}</p>
          {venue.is_lgbtq_owned ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-sage">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              LGBTQ+ owned
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
