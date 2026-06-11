import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listJournalDestinations, listJournalEntries } from "@/services/journal";
import Link from "next/link";

type CountryJournalPageProps = {
  params: Promise<{ countrySlug: string }>;
};

export default async function CountryJournalPage({ params }: CountryJournalPageProps) {
  const user = await requireUser();
  const { countrySlug } = await params;
  const [entries, destinations] = user ? await Promise.all([listJournalEntries(user.id, { countrySlug }), listJournalDestinations(user.id)]) : [[], []];
  const country = destinations.find((item) => item.slug === countrySlug);

  if (!country) notFound();

  return (
    <PageShell eyebrow="Destination" title={`${country.name} journal gallery.`} copy="Entries and private photos grouped by destination.">
      <div className="mb-6 flex flex-wrap gap-3">
        {country.cities.map((city) => (
          <Link key={city.slug} className="text-sm font-semibold text-primary hover:underline" href={`/journal/destinations/${country.slug}/${city.slug}`}>
            {city.name}
          </Link>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/journal/${entry.id}`}>
            <Card className="bg-card/90 p-5 hover:bg-card">
              <p className="text-sm text-muted-foreground">{entry.entry_date} · {entry.city}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold">{entry.title}</h2>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{entry.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
