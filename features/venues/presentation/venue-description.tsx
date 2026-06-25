type VenueDescriptionProps = {
  description?: string | null;
};

export function VenueDescription({ description }: VenueDescriptionProps) {
  if (!description?.trim()) return null;

  return (
    <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{description}</p>
  );
}
