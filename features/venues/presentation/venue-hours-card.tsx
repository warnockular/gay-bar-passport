import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPublicVenuePresentation, type VenuePresentationInput } from "@/lib/venue-presentation";

type VenueHoursCardProps = {
  className?: string;
  venue: VenuePresentationInput;
};

export function VenueHoursCard({ className, venue }: VenueHoursCardProps) {
  const { hours } = getPublicVenuePresentation(venue);

  if (!hours) return null;

  return (
    <div className={cn("flex items-start gap-3 rounded-md border border-border bg-card/80 p-4 text-sm", className)}>
      <Clock className="mt-0.5 h-4 w-4 text-sage" aria-hidden="true" />
      <div>
        <p className="font-semibold">Hours</p>
        <p className="mt-1 text-muted-foreground">{hours}</p>
      </div>
    </div>
  );
}
