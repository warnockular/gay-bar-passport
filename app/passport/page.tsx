import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import type { Metadata } from "next";
import { PassportStamp } from "@/components/landing/passport-stamp";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PassportVisitCard } from "@/features/visits/passport-visit-card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { listPassportVisits, listUserAchievements } from "@/services/visits";
import { Trophy } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Passport | Gay Bar Passport",
  robots: { index: false, follow: false }
};

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
                <PassportVisitCard key={visit.id} visit={visit} />
              ))
            ) : (
              <Card className="bg-card/90 p-6">
                <p className="font-semibold">Your passport is ready for its first stamp.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Save a venue, visit it, then log the stop to turn the night into a private travel memory.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className={cn(buttonVariants())} href="/venues">
                    Browse venues
                  </Link>
                  <Link className={cn(buttonVariants({ variant: "outline" }))} href="/favorites">
                    View favorites
                  </Link>
                </div>
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
                <p className="text-sm leading-6 text-muted-foreground">
                  Achievements unlock as your saved venues, first visits, and city memories accumulate.
                </p>
              )}
            </div>
          </Card>
          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">Memory loop</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li><span className="font-semibold text-foreground">1.</span> Favorite venues you want to remember.</li>
              <li><span className="font-semibold text-foreground">2.</span> Log the visit after you go.</li>
              <li><span className="font-semibold text-foreground">3.</span> Add a journal entry when the story deserves more room.</li>
            </ol>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
