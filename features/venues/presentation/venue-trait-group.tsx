import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueTraitGroupProps = {
  className?: string;
  venue: VenuePresentationInput;
};

export function VenueTraitGroup({ className, venue }: VenueTraitGroupProps) {
  const { tags } = getPublicVenuePresentation(venue);

  if (!tags.length) return null;

  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Venue Traits</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link key={tag.slug} href={`/venues?tag=${tag.slug}`}>
            <Badge className="bg-background normal-case tracking-normal">{tag.name}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
