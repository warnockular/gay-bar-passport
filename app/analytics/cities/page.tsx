import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { BarList, DestinationHeatMap } from "@/features/analytics/analytics-widgets";
import { requireUser } from "@/lib/auth";
import { getTravelAnalytics } from "@/services/analytics";

export const metadata: Metadata = {
  title: "City Analytics | Gay Bar Passport",
  description: "Review private city-level travel intensity and destination patterns.",
  robots: { index: false, follow: false }
};

export default async function AnalyticsCitiesPage() {
  const user = await requireUser();
  const analytics = user ? await getTravelAnalytics(user.id) : null;

  return (
    <PageShell eyebrow="Cities" title="City-level travel intensity." copy="See which queer travel destinations have the strongest signal in your passport.">
      {analytics ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Top cities</h2>
            <div className="mt-6">
              <BarList items={analytics.cities} empty="City activity appears after your first logged visit." />
            </div>
          </Card>
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">City heat map</h2>
            <div className="mt-6">
              <DestinationHeatMap items={analytics.cities} />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-card/90 p-6">Sign in to see city insights.</Card>
      )}
    </PageShell>
  );
}
