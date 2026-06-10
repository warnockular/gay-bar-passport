import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { VenueCard } from "@/features/venues/venue-card";
import { requireUser } from "@/lib/auth";
import { listFavoriteVenueIds, listFavoriteVenues } from "@/services/venues";

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
        <Card className="bg-card/85 p-6">
          <p className="font-semibold">No favorites yet.</p>
          <Link className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" href="/venues">
            Browse venues
          </Link>
        </Card>
      )}
    </PageShell>
  );
}
