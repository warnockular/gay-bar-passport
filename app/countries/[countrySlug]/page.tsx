import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { VenueCard } from "@/features/venues/venue-card";
import { getCurrentUser } from "@/lib/auth";
import { listCities, listCountries, listFavoriteVenueIds, listPublishedVenues } from "@/services/venues";

type CountryPageProps = {
  params: Promise<{ countrySlug: string }>;
};

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { countrySlug } = await params;
  const countries = await listCountries();
  const country = countries.find((item) => item.slug === countrySlug);
  return {
    title: country ? `${country.name} LGBTQ+ Venue Guide | Gay Bar Passport` : "Country Guide | Gay Bar Passport",
    description: country ? `Browse curated LGBTQ+ venues and city collections in ${country.name}.` : "Browse LGBTQ+ venue guides by country."
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { countrySlug } = await params;
  const [countries, venues, cities, user] = await Promise.all([
    listCountries(),
    listPublishedVenues({ countrySlug }),
    listCities(countrySlug),
    getCurrentUser()
  ]);
  const country = countries.find((item) => item.slug === countrySlug);

  if (!country) {
    notFound();
  }

  const favoriteIds = await listFavoriteVenueIds(user?.id);

  return (
    <PageShell eyebrow="Country" title={`${country.name} queer venue guide.`} copy="Browse city collections and save favorite venues for future trips.">
      <div className="mb-6 flex flex-wrap gap-2">
        {cities.map((city) => (
          <a key={city.slug} className="text-sm font-semibold text-primary hover:underline" href={`/countries/${countrySlug}/${city.slug}`}>
            {city.name}
          </a>
        ))}
      </div>
      <div className="space-y-5">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} favoriteIds={favoriteIds} isSignedIn={Boolean(user)} />
        ))}
      </div>
    </PageShell>
  );
}
