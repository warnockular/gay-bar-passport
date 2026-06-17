import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitForm } from "@/features/visits/visit-form";
import { requireUser } from "@/lib/auth";
import { getVenueBySlug } from "@/services/venues";

type LogVisitPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LogVisitPage({ params }: LogVisitPageProps) {
  await requireUser();
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  return (
    <PageShell eyebrow="Visit log" title={`Stamp your visit to ${venue.name}.`} copy="Capture the date, rating, private notes, and photos from this venue stop. Your notes stay private.">
      <Card className="max-w-3xl bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{venue.city}, {venue.country}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Saving creates a passport stamp and adds this stop to your personal travel archive.</p>
        </CardHeader>
        <CardContent>
          <VisitForm mode="create" venue={venue} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
