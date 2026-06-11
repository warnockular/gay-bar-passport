import Link from "next/link";
import { BarChart3, Globe2, MapPinned } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActivityChart, BarList, DestinationHeatMap, MetricCard, RecentActivity, SummaryCards, TravelMap } from "@/features/analytics/analytics-widgets";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getTravelAnalytics } from "@/services/analytics";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const analytics = user ? await getTravelAnalytics(user.id) : null;

  if (!analytics) {
    return (
      <PageShell eyebrow="Analytics" title="Travel insight starts with your first stamp." copy="Configure Supabase and sign in to see your passport analytics.">
        <Card className="bg-card/90 p-6">Analytics are waiting for an authenticated traveler.</Card>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Analytics" title="Your global queer travel footprint." copy="A private command center for visits, stamps, journals, destinations, and community momentum.">
      <div className="mb-8 flex flex-wrap gap-3">
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/analytics/map">
          <Globe2 className="h-4 w-4" aria-hidden="true" />
          Map
        </Link>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/analytics/countries">
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          Countries
        </Link>
        <Link className={cn(buttonVariants({ variant: "outline" }))} href="/analytics/activity">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Activity
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Countries" value={analytics.countries.length} />
        <MetricCard label="Cities" value={analytics.cities.length} />
        <MetricCard label="Venues" value={analytics.venuesVisited} />
        <MetricCard label="Favorites" value={analytics.favorites} />
        <MetricCard label="Stamps" value={analytics.passportStamps} />
        <MetricCard label="Achievements" value={analytics.achievements} />
        <MetricCard label="Journal entries" value={analytics.journalEntries} />
        <MetricCard label="Travelers" value={analytics.community.travelerCount} />
      </div>

      <div className="mt-8">
        <SummaryCards analytics={analytics} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Travel cadence</h2>
          <div className="mt-6">
            <ActivityChart visits={analytics.activity.visitsOverTime} journals={analytics.activity.journalsOverTime} />
          </div>
        </Card>
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Top destinations</h2>
          <div className="mt-6">
            <BarList items={analytics.countries.slice(0, 6)} empty="Visited countries appear after your first logged venue." />
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <TravelMap analytics={analytics} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Heat map</h2>
          <div className="mt-6">
            <DestinationHeatMap items={analytics.countries} />
          </div>
        </Card>
        <Card className="bg-card/90 p-6">
          <h2 className="font-serif text-3xl font-semibold">Recent activity</h2>
          <div className="mt-6">
            <RecentActivity analytics={analytics} />
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
