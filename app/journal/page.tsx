import { BookOpen, MapPinned, PenLine } from "lucide-react";
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
                  </div>
                  <h2 className="mt-4 font-serif text-3xl font-semibold">{entry.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {entry.entry_date} · {entry.city}, {entry.country}
                  </p>
                  <p className="mt-4 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{entry.body}</p>
                </Card>
              </Link>
            ))
          ) : (
            <Card className="bg-card/90 p-6">
              <BookOpen className="h-5 w-5 text-terracotta" aria-hidden="true" />
              <p className="mt-4 font-semibold">No journal entries yet.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Start with a city, venue, or visit you want to remember.</p>
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
