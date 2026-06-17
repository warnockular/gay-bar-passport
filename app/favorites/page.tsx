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
    <PageShell eyebrow="Favorites" title="Your saved venue shortlist." copy="Keep a private shortlist of venues for upcoming trips, field notes, and nights you want to remember.">
      {venues.length ? (
        <div className="space-y-5">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} favoriteIds={favoriteIds} isSignedIn />
          ))}
        </div>
      ) : (
        <EmptyState
          action={<Link className={buttonVariants()} href="/venues">Browse venues</Link>}
          description="Tap Favorite on venue cards or detail pages to build a trip list before you go."
          title="No favorites yet."
        />
      )}
    </PageShell>
  );
}
