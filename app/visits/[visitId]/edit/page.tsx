import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitForm } from "@/features/visits/visit-form";
import { requireUser } from "@/lib/auth";
import { getVisitForEdit } from "@/services/visits";

type EditVisitPageProps = {
  params: Promise<{ visitId: string }>;
};

export default async function EditVisitPage({ params }: EditVisitPageProps) {
  const user = await requireUser();
  const { visitId } = await params;
  const visit = user ? await getVisitForEdit(user.id, visitId) : null;

  if (!visit) {
    notFound();
  }

  return (
    <PageShell eyebrow="Edit visit" title={`Update ${visit.venue?.name ?? "this passport stop"}.`} copy="Adjust your rating, private notes, mood, or add more photos without losing the existing memory.">
      <Card className="max-w-3xl bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{visit.visited_on}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Existing photos stay attached when you save. Use Cancel to return to your passport.</p>
        </CardHeader>
        <CardContent>
          <VisitForm mode="edit" visit={visit} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
