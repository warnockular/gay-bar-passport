import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VenueClaimForm } from "@/features/venues/venue-claim-form";
import { requireUser } from "@/lib/auth";
import { getVenueBySlug } from "@/services/venues";

type VenueClaimPageProps = {
  params: Promise<{ slug: string }>;
};

export const metadata: Metadata = {
  title: "Request Venue Ownership | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function VenueClaimPage({ params }: VenueClaimPageProps) {
  await requireUser();
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) notFound();

  return (
    <section className="container py-14 md:py-20">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ownership claim</p>
        <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-5xl">Request ownership review for {venue.name}.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Submit business context for the admin team. Approval links your profile to this venue and marks the venue as owner verified.
        </p>
        <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={`/venues/${venue.slug}`}>
          Back to venue
        </Link>
      </div>
      <Card className="mt-10 bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Claim details</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueClaimForm venueId={venue.id} venueSlug={venue.slug} />
        </CardContent>
      </Card>
    </section>
  );
}
