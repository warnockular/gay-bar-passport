"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Camera, Pencil, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { venueCategoryLabel } from "@/lib/venue-categories";
import type { PassportVisit } from "@/services/visits";

type PassportVisitCardProps = {
  visit: PassportVisit;
};

export function PassportVisitCard({ visit }: PassportVisitCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showVenueImage = Boolean(visit.venue?.image_url) && !imageFailed;
  const photoCount = visit.photos.filter((photo) => photo.signedUrl).length;
  const formattedDate = new Date(`${visit.visited_on}T00:00:00`).toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const notesPreview = visit.private_notes && visit.private_notes.length > 220 ? `${visit.private_notes.slice(0, 220).trim()}...` : visit.private_notes;

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
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge>{visit.venue?.category ? venueCategoryLabel(visit.venue.category) : "Visit"}</Badge>
                {visit.stamp ? <Badge>{visit.stamp.stamp_code}</Badge> : null}
                <Badge>{photoCount} {photoCount === 1 ? "photo" : "photos"}</Badge>
              </div>
              <h2 className="mt-3 font-serif text-3xl font-semibold">{visit.venue?.name ?? "Venue visit"}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
                {formattedDate}
                {visit.venue ? <span>· {visit.venue.city}, {visit.venue.country}</span> : null}
              </p>
            </div>
            <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }))} href={`/visits/${visit.id}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit Visit
            </Link>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              <Star className="h-4 w-4 fill-current text-burnt" aria-hidden="true" />
              {visit.rating ?? 0} / 5
            </p>
            {visit.mood ? <p className="text-muted-foreground">{visit.mood.replace("_", " ")}</p> : null}
          </div>
          {notesPreview ? (
            <div className="rounded-md border border-border/80 bg-background/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Private note</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{notesPreview}</p>
            </div>
          ) : null}
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
