import { BookOpen, Camera, MapPinned, PenLine, Star } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { listJournalDestinations, listJournalEntries } from "@/services/journal";

export const metadata: Metadata = {
  title: "Journal | Gay Bar Passport",
  description: "Write and manage private queer travel journal entries.",
  robots: { index: false, follow: false }
};

export default async function JournalPage() {
  const user = await requireUser();
  const [entries, destinations] = user ? await Promise.all([listJournalEntries(user.id), listJournalDestinations(user.id)]) : [[], []];

  return (
    <PageShell eyebrow="Journal" title="A private archive for queer travel memory." copy="Write destination notes, attach venues and visits, and build a photo-rich travel diary.">
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link className={cn(buttonVariants())} href="/journal/new">
          <PenLine className="h-4 w-4" aria-hidden="true" />
          New entry
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {entries.length ? (
            entries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`}>
                <Card className="bg-card/90 p-5 transition-colors hover:bg-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{entry.city ?? "Journal"}</Badge>
                    {entry.venue ? <Badge className="normal-case tracking-normal">{entry.venue.name}</Badge> : null}
                    {entry.visit ? <Badge className="normal-case tracking-normal">Visit memory</Badge> : null}
                    {entry.photos.length ? <Badge>{entry.photos.length} {entry.photos.length === 1 ? "photo" : "photos"}</Badge> : null}
                  </div>
                  <h2 className="mt-4 font-serif text-3xl font-semibold">{entry.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>{entry.entry_date}</span>
                    <span>{[entry.city, entry.country].filter(Boolean).join(", ")}</span>
                    {entry.visit?.rating ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-current text-burnt" aria-hidden="true" />
                        {entry.visit.rating}/5
                      </span>
                    ) : null}
                    {entry.visit?.mood ? <span>{entry.visit.mood.replace("_", " ")}</span> : null}
                  </div>
                  {entry.visit?.private_notes ? (
                    <p className="mt-4 rounded-md border border-border/80 bg-background/60 p-3 text-sm leading-6 text-muted-foreground">
                      {entry.visit.private_notes.length > 180 ? `${entry.visit.private_notes.slice(0, 180).trim()}...` : entry.visit.private_notes}
                    </p>
                  ) : null}
                  <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{entry.body}</p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="bg-card/90 p-6">
              <BookOpen className="h-5 w-5 text-terracotta" aria-hidden="true" />
              <p className="mt-4 font-semibold">No journal entries yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the journal for the story behind a stamp: who you met, what the room felt like, and what you want to remember later.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className={cn(buttonVariants())} href="/journal/new">
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                  Write first entry
                </Link>
                <Link className={cn(buttonVariants({ variant: "outline" }))} href="/passport">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  View passport
                </Link>
              </div>
            </Card>
          )}
        </div>
        <Card className="h-fit bg-card/90 p-5">
          <div className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-sage" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold">Destinations</h2>
          </div>
          <div className="mt-5 space-y-4">
            {destinations.length ? (
              destinations.map((country) => (
                <div key={country.slug}>
                  <Link className="font-semibold text-primary hover:underline" href={`/journal/destinations/${country.slug}`}>
                    {country.name} ({country.count})
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {country.cities.map((city) => (
                      <Link key={city.slug} className="text-xs font-semibold text-muted-foreground hover:text-primary" href={`/journal/destinations/${country.slug}/${city.slug}`}>
                        {city.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">Destination galleries appear after entries are saved.</p>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
