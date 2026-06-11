import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/state/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { VenueCard } from "@/features/venues/venue-card";
import { requireUser } from "@/lib/auth";
import { listFavoriteVenueIds, listFavoriteVenues } from "@/services/venues";

export const metadata: Metadata = {
  title: "Favorites | Gay Bar Passport",
  description: "Review your private saved LGBTQ+ venue shortlist.",
  robots: { index: false, follow: false }
};

export default async function FavoritesPage() {
  const user = await requireUser();

  if (!user) {
    return null;
  }

  const [venues, favoriteIds] = await Promise.all([listFavoriteVenues(user.id), listFavoriteVenueIds(user.id)]);

  return (
    <PageShell eyebrow="Favorites" title="Your saved venue shortlist." copy="Favorite venues now live in Supabase and follow the signed-in traveler.">
      {venues.length ? (
        <div className="space-y-5">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} favoriteIds={favoriteIds} isSignedIn />
          ))}
        </div>
      ) : (
        <EmptyState
          action={<Link className={buttonVariants()} href="/venues">Browse venues</Link>}
          description="Save venues while browsing to build a shortlist for future trips."
          title="No favorites yet."
        />
      )}
    </PageShell>
  );
}
