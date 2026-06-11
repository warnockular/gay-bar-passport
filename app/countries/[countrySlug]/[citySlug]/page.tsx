import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import type { Metadata } from "next";
import { VenueCard } from "@/features/venues/venue-card";
import { getCurrentUser } from "@/lib/auth";
import { listFavoriteVenueIds, listPublishedVenues } from "@/services/venues";

type CityPageProps = {
  params: Promise<{ citySlug: string; countrySlug: string }>;
};

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { citySlug, countrySlug } = await params;
  const venues = await listPublishedVenues({ citySlug, countrySlug });
  const venue = venues[0];
  return {
    title: venue ? `${venue.city} LGBTQ+ Venues | Gay Bar Passport` : "City Venue Guide | Gay Bar Passport",
    description: venue ? `Browse LGBTQ+ venues in ${venue.city}, ${venue.country}.` : "Browse LGBTQ+ venues by city."
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { citySlug, countrySlug } = await params;
  const user = await getCurrentUser();
  const venues = await listPublishedVenues({ countrySlug, citySlug });

  if (!venues.length) {
    notFound();
  }

  const favoriteIds = await listFavoriteVenueIds(user?.id);
  const { city, country } = venues[0];

  return (
    <PageShell eyebrow="City" title={`${city} LGBTQ+ venues.`} copy={`A focused directory for ${city}, ${country}, ready for favorites and future visit logging.`}>
      <div className="space-y-5">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} favoriteIds={favoriteIds} isSignedIn={Boolean(user)} />
        ))}
      </div>
    </PageShell>
  );
}
