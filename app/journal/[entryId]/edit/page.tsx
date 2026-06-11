import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JournalForm } from "@/features/journal/journal-form";
import { requireUser } from "@/lib/auth";
import { getJournalEntry, getJournalFormOptions } from "@/services/journal";

type EditJournalEntryPageProps = {
  params: Promise<{ entryId: string }>;
};

export default async function EditJournalEntryPage({ params }: EditJournalEntryPageProps) {
  const user = await requireUser();
  const { entryId } = await params;
  const [entry, options] = user ? await Promise.all([getJournalEntry(user.id, entryId), getJournalFormOptions(user.id)]) : [null, { favorites: [], venues: [], visits: [] }];

  if (!entry) notFound();

  return (
    <PageShell eyebrow="Edit entry" title="Refine this travel note." copy="Update the destination, associations, text, or add more private photos.">
      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{entry.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalForm mode="edit" entry={entry} options={options} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
