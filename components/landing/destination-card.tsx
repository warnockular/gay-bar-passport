import Image from "next/image";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { UnsplashImage } from "@/services/unsplash";

type DestinationCardProps = {
  city: string;
  region: string;
  image: UnsplashImage;
  note: string;
};

export function DestinationCard({ city, region, image, note }: DestinationCardProps) {
  return (
    <Card className="group overflow-hidden bg-card/85">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image src={image.src} alt={image.alt} fill className="object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-cream">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cream/75">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {region}
          </div>
          <div className="mt-2 flex items-end justify-between gap-4">
            <h3 className="font-serif text-3xl font-semibold">{city}</h3>
            <ArrowUpRight className="h-5 w-5 transition group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="p-5 text-sm leading-6 text-muted-foreground">{note}</p>
    </Card>
  );
}
