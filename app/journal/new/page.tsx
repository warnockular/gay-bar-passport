import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JournalForm } from "@/features/journal/journal-form";
import { requireUser } from "@/lib/auth";
import { getJournalFormOptions } from "@/services/journal";

export default async function NewJournalEntryPage() {
  const user = await requireUser();
  const options = user ? await getJournalFormOptions(user.id) : { favorites: [], venues: [], visits: [] };

  return (
    <PageShell eyebrow="New entry" title="Write the day while it still has texture." copy="Attach this entry to a place, venue, favorite, visit, and private photos.">
      <Card className="bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Journal details</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalForm mode="create" options={options} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
