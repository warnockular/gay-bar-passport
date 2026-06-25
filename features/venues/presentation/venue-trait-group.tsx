import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueTraitGroupProps = {
  className?: string;
  limit?: number;
  venue: VenuePresentationInput;
};

export function VenueTraitGroup({ className, limit, venue }: VenueTraitGroupProps) {
  const { tags } = getPublicVenuePresentation(venue);
  const visibleTags = typeof limit === "number" ? tags.slice(0, limit) : tags;

  if (!visibleTags.length) return null;

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Venue Traits</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {visibleTags.map((tag) => (
          <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
            <Badge className="bg-background normal-case tracking-normal">{tag.name}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
