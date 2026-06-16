"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Camera, Pencil, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PassportVisit } from "@/services/visits";

type PassportVisitCardProps = {
  visit: PassportVisit;
};

export function PassportVisitCard({ visit }: PassportVisitCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showVenueImage = Boolean(visit.venue?.image_url) && !imageFailed;

  return (
    <Card className="overflow-hidden bg-card/90">
      <div className={cn("grid gap-0", showVenueImage && "md:grid-cols-[14rem_1fr]")}>
        {showVenueImage ? (
          <div className="relative min-h-52">
            <div className="flex h-full min-h-52 w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.72),rgba(255,255,255,0.28))] p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={visit.venue?.image_url ?? ""}
                alt={`${visit.venue?.name ?? "Venue"} venue`}
                className="max-h-full max-w-full object-contain"
                onError={() => setImageFailed(true)}
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge>{visit.venue?.category ?? "visit"}</Badge>
              <h2 className="mt-3 font-serif text-3xl font-semibold">{visit.venue?.name ?? "Venue visit"}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
                {visit.visited_on} · {visit.venue?.city}, {visit.venue?.country}
              </p>
            </div>
            <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/visits/${visit.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
          </div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Star className="h-4 w-4 fill-current text-burnt" aria-hidden="true" />
            {visit.rating ?? 0} / 5
          </p>
          {visit.private_notes ? <p className="rounded-md border border-border/80 bg-background/60 p-4 text-sm leading-6 text-muted-foreground">{visit.private_notes}</p> : null}
          {visit.photos.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {visit.photos.map((photo) =>
                photo.signedUrl ? (
                  <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-md border border-border">
                    <Image src={photo.signedUrl} alt={`${visit.venue?.name ?? "Visit"} photo`} fill className="object-cover" sizes="12rem" />
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Camera className="h-4 w-4" aria-hidden="true" />
              No photos attached yet.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
