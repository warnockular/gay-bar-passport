import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { VenueDirectory } from "@/features/venues/venue-directory";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { listCountries, listFavoriteVenueIds, listPublishedVenues, listTags } from "@/services/venues";
import type { Enums } from "@/types/database";

const categories: Enums<"venue_category">[] = ["bar", "club", "lounge", "cafe", "performance", "community"];

export const metadata: Metadata = {
  title: "LGBTQ+ Venue Directory | Gay Bar Passport",
  description: "Browse curated LGBTQ+ bars, lounges, clubs, cafes, and community venues around the world."
};

type VenuesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function valueFromSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function categoryFromSearchParam(value: string | undefined): Enums<"venue_category"> | undefined {
  return categories.includes(value as Enums<"venue_category">) ? (value as Enums<"venue_category">) : undefined;
}

export default async function VenuesPage({ searchParams }: VenuesPageProps) {
  const params = (await searchParams) ?? {};
  const category = categoryFromSearchParam(valueFromSearchParam(params.category));
  const countrySlug = valueFromSearchParam(params.country);
  const tag = valueFromSearchParam(params.tag);
  const query = valueFromSearchParam(params.q);
  const user = await getCurrentUser();
  const [venues, tags, countries, favoriteIds] = await Promise.all([
    listPublishedVenues({ category, countrySlug, query, tag }),
    listTags(),
    listCountries(),
    listFavoriteVenueIds(user?.id)
  ]);

  return (
    <PageShell
      eyebrow="Venues"
      title="Browse LGBTQ+ venues around the world."
      copy="Search the first curated directory by city, country, venue type, and travel mood tags."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link className={cn(buttonVariants({ variant: "outline" }))} href={user ? "/venues/submit" : "/auth/sign-in?next=/venues/submit"}>
          Submit Venue
        </Link>
      </div>
      <VenueDirectory
        categories={categories}
        countries={countries}
        favoriteIds={favoriteIds}
        isSignedIn={Boolean(user)}
        selectedCategory={category}
        selectedCountry={countrySlug}
        selectedTag={tag}
        tags={tags}
        venues={venues}
      />
    </PageShell>
  );
}
