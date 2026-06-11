import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { listJournalEntries } from "@/services/journal";

type CityJournalPageProps = {
  params: Promise<{ citySlug: string; countrySlug: string }>;
};

export default async function CityJournalPage({ params }: CityJournalPageProps) {
  const user = await requireUser();
  const { citySlug, countrySlug } = await params;
  const entries = user ? await listJournalEntries(user.id, { citySlug, countrySlug }) : [];

  if (!entries.length) notFound();

  const { city, country } = entries[0];

  return (
    <PageShell eyebrow="City gallery" title={`${city} journal entries.`} copy={`Private entries, venue notes, and photos from ${city}, ${country}.`}>
      <div className="grid gap-5 md:grid-cols-2">
        {entries.map((entry) => (
          <Link key={entry.id} href={`/journal/${entry.id}`}>
            <Card className="bg-card/90 p-5 hover:bg-card">
              {entry.photos[0]?.signedUrl ? <img src={entry.photos[0].signedUrl} alt="" className="mb-4 aspect-[4/3] w-full rounded-md object-cover" /> : null}
              <p className="text-sm text-muted-foreground">{entry.entry_date}</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold">{entry.title}</h2>
              <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{entry.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
