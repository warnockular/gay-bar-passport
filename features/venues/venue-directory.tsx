import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { VenueCard } from "@/features/venues/venue-card";
import type { VenueTag, VenueWithTags } from "@/services/venues";
import type { Enums } from "@/types/database";

type Option = {
  name: string;
  slug: string;
};

type VenueDirectoryProps = {
  categories: Enums<"venue_category">[];
  countries: Option[];
  favoriteIds?: string[];
  isSignedIn?: boolean;
  selectedCategory?: string;
  selectedCountry?: string;
  selectedTag?: string;
  tags: VenueTag[];
  venues: VenueWithTags[];
};

export function VenueDirectory({
  categories,
  countries,
  favoriteIds = [],
  isSignedIn = false,
  selectedCategory,
  selectedCountry,
  selectedTag,
  tags,
  venues
}: VenueDirectoryProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/85 p-4">
        <form className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_12rem_auto]" action="/venues">
          <div className="relative">
            <label htmlFor="venue-search" className="sr-only">
              Search venues, cities, or neighborhoods
            </label>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input id="venue-search" name="q" placeholder="Search venues, cities, neighborhoods" className="pl-9" />
          </div>
          <label htmlFor="venue-category" className="sr-only">
            Filter by venue type
          </label>
          <select id="venue-category" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" name="category" defaultValue={selectedCategory ?? ""}>
            <option value="">All types</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <label htmlFor="venue-country" className="sr-only">
            Filter by country
          </label>
          <select id="venue-country" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" name="country" defaultValue={selectedCountry ?? ""}>
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </select>
          <label htmlFor="venue-tag" className="sr-only">
            Filter by tag
          </label>
          <select id="venue-tag" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" name="tag" defaultValue={selectedTag ?? ""}>
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.slug} value={tag.slug}>
                {tag.name}
              </option>
            ))}
          </select>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {venues.length ? (
        <div className="space-y-5">
          {venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} favoriteIds={favoriteIds} isSignedIn={isSignedIn} />
          ))}
        </div>
      ) : (
        <Card className="bg-card/85 p-6">
          <p className="font-semibold">No venues matched those filters.</p>
          <Link className="mt-3 inline-block text-sm font-semibold text-primary hover:underline" href="/venues">
            Clear filters
          </Link>
        </Card>
      )}
    </div>
  );
}
