import Link from "next/link";
import { Users } from "lucide-react";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/features/social/social-controls";
import { requireUser } from "@/lib/auth";
import { listPublicProfiles } from "@/services/social";

export const metadata: Metadata = {
  title: "Travelers | Gay Bar Passport",
  description: "Discover Gay Bar Passport traveler profiles and follow public journeys.",
  robots: { index: false, follow: false }
};

export default async function UsersPage() {
  const user = await requireUser();
  const profiles = user ? await listPublicProfiles(user.id) : [];

  return (
    <PageShell eyebrow="Community" title="Discover passport travelers." copy="Find public traveler profiles and follow the journeys you want in your feed.">
      <div className="grid gap-5 md:grid-cols-2">
        {profiles.length ? (
          profiles.map((profile) => (
            <Card key={profile.id} className="bg-card/90 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge>{profile.home_city ?? "Traveler"}</Badge>
                  <Link href={`/users/${profile.id}`}>
                    <h2 className="mt-3 font-serif text-3xl font-semibold hover:text-primary">{profile.display_name ?? "Passport traveler"}</h2>
                  </Link>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {profile.followerCount} follower(s) · {profile.followingCount} following
                  </p>
                </div>
                {profile.id !== user?.id ? <FollowButton profileId={profile.id} isFollowing={profile.isFollowing} /> : null}
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-card/90 p-6">
            <Users className="h-5 w-5 text-sage" aria-hidden="true" />
            <p className="mt-4 font-semibold">No public profiles yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Profiles appear here as travelers create accounts.</p>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
