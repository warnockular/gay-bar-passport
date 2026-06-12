import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Submit Venue | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function SubmitVenuePage() {
  await requireUser();

  return (
    <section className="container py-14 md:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Community submission</p>
        <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-5xl">Submit a venue for review.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Share a queer venue recommendation with the moderation team. Submissions stay unpublished until an admin reviews them.
        </p>
      </div>
      <Card className="mt-10 bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Venue details</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueSubmissionForm />
        </CardContent>
      </Card>
    </section>
  );
}
