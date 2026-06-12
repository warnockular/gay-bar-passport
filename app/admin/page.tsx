import { Activity, Flag, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminSummary } from "@/services/admin";

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-card/90 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold">{value}</p>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const summary = await getAdminSummary();

  return (
    <div>
      <div className="max-w-3xl">
        <Badge>Operations</Badge>
        <h1 className="mt-5 font-serif text-5xl font-semibold leading-tight md:text-6xl">Platform control room.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">Operational summaries, moderation pressure, and recent platform movement.</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total users" value={summary.totalUsers} />
        <SummaryCard label="Public profiles" value={summary.publicProfiles} />
        <SummaryCard label="Venues" value={summary.venues} />
        <SummaryCard label="Favorites" value={summary.favorites} />
        <SummaryCard label="Visits" value={summary.visits} />
        <SummaryCard label="Passport stamps" value={summary.passportStamps} />
        <SummaryCard label="Journal entries" value={summary.journalEntries} />
        <SummaryCard label="Public journals" value={summary.publicJournals} />
        <SummaryCard label="Comments" value={summary.comments} />
        <SummaryCard label="Follows" value={summary.follows} />
        <SummaryCard label="Moderation queue" value={summary.moderationQueue} />
        <SummaryCard label="Unverified venues" value={summary.venueModeration.unverified} />
        <SummaryCard label="Pending venue review" value={summary.venueModeration.pendingReview} />
        <SummaryCard label="Verified venues" value={summary.venueModeration.verified} />
        <SummaryCard label="Imported venues" value={summary.venueModeration.imported} />
        <SummaryCard label="Pending imports" value={summary.importReadiness.pendingImports} />
        <SummaryCard label="Staged venues" value={summary.importReadiness.stagedVenues} />
        <SummaryCard label="Duplicate candidates" value={summary.importReadiness.duplicateCandidates} />
        <SummaryCard label="Approved imports" value={summary.importReadiness.approvedImports} />
        <SummaryCard label="Publish ready venues" value={summary.venueQuality.publishReady} />
        <SummaryCard label="Incomplete venues" value={summary.venueQuality.incomplete} />
        <SummaryCard label="Featured ready venues" value={summary.venueQuality.featuredReady} />
        <SummaryCard label="Avg completeness" value={summary.venueQuality.averageCompleteness} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="bg-card/90 p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sage" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold">Recent activity</h2>
          </div>
          <div className="mt-5 space-y-3">
            {summary.recentActivity.length ? summary.recentActivity.map((item) => (
              <p key={`${item.date}-${item.label}`} className="rounded-md border border-border bg-background/70 p-3 text-sm">
                <span className="font-semibold">{item.label}</span>
                <span className="text-muted-foreground"> · {new Date(item.date).toLocaleString()}</span>
              </p>
            )) : <p className="text-sm text-muted-foreground">No recent activity.</p>}
          </div>
        </Card>
        <Card className="bg-card/90 p-6">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-terracotta" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold">Moderation queue</h2>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{summary.moderationQueue} open item(s) need review.</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden="true" />
            New users and content activity are tracked in audit logs as actions are taken.
          </div>
        </Card>
      </div>
    </div>
  );
}
