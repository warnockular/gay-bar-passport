import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Pencil } from "lucide-react";
import { DeleteJournalButton } from "@/features/journal/delete-journal-button";
import { JournalSocialPanel } from "@/features/social/journal-social-panel";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getJournalEntry } from "@/services/journal";
import { getPublicJournalEntry } from "@/services/social";

type JournalDetailPageProps = {
  params: Promise<{ entryId: string }>;
};

export const metadata: Metadata = {
  title: "Journal Entry | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function JournalDetailPage({ params }: JournalDetailPageProps) {
  const user = await requireUser();
  const { entryId } = await params;
  const ownerEntry = user ? await getJournalEntry(user.id, entryId) : null;
  const publicEntry = !ownerEntry && user ? await getPublicJournalEntry(entryId, user.id) : null;
  const entry = ownerEntry ?? publicEntry;
  const photos = ownerEntry?.photos ?? [];

  if (!entry) notFound();

  return (
    <PageShell eyebrow="Journal entry" title={entry.title} copy={`${entry.city}, ${entry.country}`}>
      {ownerEntry ? (
        <div className="mb-6 flex flex-wrap gap-3">
          <Link className={cn(buttonVariants({ variant: "outline" }))} href={`/journal/${entry.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Link>
          <DeleteJournalButton entryId={entry.id} />
        </div>
      ) : null}
      <Card className="bg-card/90 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          <Badge>{entry.country}</Badge>
          <Badge>{entry.city}</Badge>
          {entry.venue ? <Badge className="normal-case tracking-normal">{entry.venue.name}</Badge> : null}
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-terracotta" aria-hidden="true" />
          {entry.entry_date}
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-sage" aria-hidden="true" />
          <Link className="hover:text-primary" href={`/journal/destinations/${entry.country_slug}/${entry.city_slug}`}>
            Destination gallery
          </Link>
        </p>
        <article className="prose prose-sm mt-8 max-w-none whitespace-pre-line leading-8 text-foreground">{entry.body}</article>
        {photos.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {photos.map((photo) =>
              photo.signedUrl ? (
                <div key={photo.id} className="overflow-hidden rounded-md border border-border">
                  <Image src={photo.signedUrl} alt={`${entry.title} journal photo`} width={800} height={600} className="h-full w-full object-cover" />
                </div>
              ) : null
            )}
          </div>
        ) : null}
      </Card>
      {!entry.is_private && publicEntry ? <JournalSocialPanel entry={publicEntry} /> : null}
    </PageShell>
  );
}
