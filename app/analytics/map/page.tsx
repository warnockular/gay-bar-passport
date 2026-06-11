import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { DestinationHeatMap, TravelMap } from "@/features/analytics/analytics-widgets";
import { requireUser } from "@/lib/auth";
import { getTravelAnalytics } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Travel Map | Gay Bar Passport",
  description: "View a private map-style summary of your visited venues and destinations.",
  robots: { index: false, follow: false }
};

export default async function AnalyticsMapPage() {
  const user = await requireUser();
  const analytics = user ? await getTravelAnalytics(user.id) : null;

  return (
    <PageShell eyebrow="Map" title="A practical map of your visited venues." copy="Venue coordinates become map points, while country intensity shows where your passport is most active.">
      {analytics ? (
        <div className="space-y-6">
          <TravelMap analytics={analytics} />
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Country intensity</h2>
            <div className="mt-6">
              <DestinationHeatMap items={analytics.countries} />
            </div>
          </Card>
        </div>
      ) : (
        <Card className="bg-card/90 p-6">Sign in to see your map.</Card>
      )}
    </PageShell>
  );
}
