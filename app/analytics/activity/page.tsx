import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { ActivityChart, BarList, RecentActivity } from "@/features/analytics/analytics-widgets";
import { requireUser } from "@/lib/auth";
import { getTravelAnalytics } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Activity Analytics | Gay Bar Passport",
  description: "Review private visit, journal, and category activity over time.",
  robots: { index: false, follow: false }
};

export default async function AnalyticsActivityPage() {
  const user = await requireUser();
  const analytics = user ? await getTravelAnalytics(user.id) : null;

  return (
    <PageShell eyebrow="Activity" title="The rhythm of your travel life." copy="Visits, journals, venue categories, and recent passport movement in one readable view.">
      {analytics ? (
        <div className="space-y-6">
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Visits and journals over time</h2>
            <div className="mt-6">
              <ActivityChart visits={analytics.activity.visitsOverTime} journals={analytics.activity.journalsOverTime} />
            </div>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card/90 p-6">
              <h2 className="font-serif text-3xl font-semibold">Venue categories</h2>
              <div className="mt-6">
                <BarList items={analytics.topCategories} empty="Venue category patterns appear after more visits." />
              </div>
            </Card>
            <Card className="bg-card/90 p-6">
              <h2 className="font-serif text-3xl font-semibold">Recent activity</h2>
              <div className="mt-6">
                <RecentActivity analytics={analytics} />
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="bg-card/90 p-6">Sign in to see activity insights.</Card>
      )}
    </PageShell>
  );
}
