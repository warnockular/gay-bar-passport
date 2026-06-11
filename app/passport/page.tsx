import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PassportStamp } from "@/components/landing/passport-stamp";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { listPassportVisits, listUserAchievements } from "@/services/visits";
import { CalendarDays, Camera, Pencil, Star, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function PassportPage() {
  const user = await requireUser();
  const [visits, achievements] = user ? await Promise.all([listPassportVisits(user.id), listUserAchievements(user.id)]) : [[], []];

  return (
    <PageShell
      eyebrow="Passport"
      title="Your queer travel stamp book."
      copy="Logged visits become private journal entries, rated venue memories, and collectible passport stamps."
    >
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card className="passport-border bg-card/85 p-6 md:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              {visits.length ? (
                visits.slice(0, 6).map((visit, index) => (
                  <PassportStamp
                    key={visit.id}
                    city={(visit.stamp?.stamp_code ?? visit.venue?.city ?? "GBP").slice(0, 4).toUpperCase()}
                    date={new Date(visit.visited_on).toLocaleDateString("en", { month: "short", year: "numeric" }).toUpperCase()}
                    tone={index % 3 === 0 ? "sage" : index % 3 === 1 ? "terracotta" : "rose"}
                  />
                ))
              ) : (
                <>
                  <PassportStamp city="LIS" date="READY" tone="sage" />
                  <PassportStamp city="CDMX" date="READY" tone="terracotta" />
                  <PassportStamp city="CPH" date="READY" tone="rose" />
                </>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            {visits.length ? (
              visits.map((visit) => (
                <Card key={visit.id} className="overflow-hidden bg-card/90">
                  <div className="grid gap-0 md:grid-cols-[14rem_1fr]">
                    {visit.venue?.image_url ? (
                      <div className="relative min-h-52">
                        <Image src={visit.venue.image_url} alt="" fill className="object-cover" sizes="14rem" />
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
                                <Image src={photo.signedUrl} alt="" fill className="object-cover" sizes="12rem" />
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
              ))
            ) : (
              <Card className="bg-card/90 p-6">
                <p className="font-semibold">No visits logged yet.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Open a venue and log your first visit to earn your first stamp.</p>
                <Link className={cn(buttonVariants(), "mt-4")} href="/venues">
                  Browse venues
                </Link>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <Card className="bg-card/90 p-5">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-terracotta" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">Achievements</h2>
            </div>
            <div className="mt-5 space-y-3">
              {achievements.length ? (
                achievements.map((achievement) => (
                  <div key={achievement.id} className="rounded-md border border-border/80 bg-background/60 p-3">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{achievement.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">Achievements unlock as visits and favorites accumulate.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
