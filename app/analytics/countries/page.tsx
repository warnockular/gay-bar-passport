import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BarList } from "@/features/analytics/analytics-widgets";
import { requireUser } from "@/lib/auth";
import { getTravelAnalytics } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Country Analytics | Gay Bar Passport",
  description: "Review private country-level travel insights from your passport activity.",
  robots: { index: false, follow: false }
};

export default async function AnalyticsCountriesPage() {
  const user = await requireUser();
  const analytics = user ? await getTravelAnalytics(user.id) : null;

  return (
    <PageShell eyebrow="Countries" title="Country insight from your passport." copy="Visited venues, journals, stamps, and destination intensity grouped by country.">
      {analytics ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-5">
            {analytics.countries.length ? (
              analytics.countries.map((country) => (
                <Card key={country.slug ?? country.label} id={country.slug} className="bg-card/90 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-serif text-3xl font-semibold">{country.label}</h2>
                    <Badge>{country.count} visit(s)</Badge>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <p className="rounded-md border border-border bg-background/70 p-3 text-sm">Visited venues: {country.count}</p>
                    <p className="rounded-md border border-border bg-background/70 p-3 text-sm">Passport stamps: {analytics.passportStamps}</p>
                    <p className="rounded-md border border-border bg-background/70 p-3 text-sm">Journal entries: {analytics.journalEntries}</p>
                  </div>
                  <Link className="mt-4 inline-block text-sm font-semibold text-primary hover:underline" href={`/countries/${country.slug}`}>
                    Open venue guide
                  </Link>
                </Card>
              ))
            ) : (
              <Card className="bg-card/90 p-6">Countries appear after you log visits.</Card>
            )}
          </div>
          <Card className="h-fit bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Top countries</h2>
            <div className="mt-6">
              <BarList items={analytics.countries} empty="No country activity yet." />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-card/90 p-6">Sign in to see country insights.</Card>
      )}
    </PageShell>
  );
}
