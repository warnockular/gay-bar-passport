import Link from "next/link";
import { Activity, MapPinned } from "lucide-react";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/state/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SocialEntryCard } from "@/features/social/social-entry-card";
import { requireUser } from "@/lib/auth";
import { listFollowedFeed } from "@/services/social";

export const metadata: Metadata = {
  title: "Feed | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function FeedPage() {
  const user = await requireUser();
  const feed = user ? await listFollowedFeed(user.id) : { entries: [], visits: [] };

  return (
    <PageShell eyebrow="Feed" title="Recent notes from travelers you follow." copy="Public journal entries and visit activity from your community, with private notes kept private.">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          {feed.entries.length ? (
            feed.entries.map((entry) => <SocialEntryCard key={entry.id} entry={entry} />)
          ) : (
            <EmptyState
              action={<Link className={buttonVariants()} href="/users">Discover travelers</Link>}
              description="Follow travelers with public journal entries to fill this space."
              icon={<Activity className="h-5 w-5" aria-hidden="true" />}
              title="Your feed is quiet."
            />
          )}
        </div>
        <Card className="h-fit bg-card/90 p-5">
          <div className="flex items-center gap-2">
            <MapPinned className="h-5 w-5 text-terracotta" aria-hidden="true" />
            <h2 className="font-serif text-2xl font-semibold">Recent visits</h2>
          </div>
          <div className="mt-5 space-y-4">
            {feed.visits.length ? (
              feed.visits.map((visit) => (
                <div key={visit.id} className="rounded-md border border-border bg-background/70 p-3">
                  <Link className="text-sm font-semibold text-primary hover:underline" href={`/users/${visit.user_id}`}>
                    {visit.author?.display_name ?? "Passport traveler"}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Visited {visit.venue?.name ?? "a venue"} in {visit.venue?.city ?? "a city"} on {visit.visited_on}.
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">No followed visit activity yet.</p>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
