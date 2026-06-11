import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BookOpen } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/features/social/social-controls";
import { SocialEntryCard } from "@/features/social/social-entry-card";
import { requireUser } from "@/lib/auth";
import { getPublicProfile, listPublicJournalEntries } from "@/services/social";

type UserProfilePageProps = {
  params: Promise<{ profileId: string }>;
};

export const metadata: Metadata = {
  title: "Traveler Profile | Gay Bar Passport",
  description: "View a Gay Bar Passport traveler profile and public journal entries."
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const user = await requireUser();
  const { profileId } = await params;
  const [profile, entries] = user ? await Promise.all([getPublicProfile(profileId, user.id), listPublicJournalEntries(user.id, { authorId: profileId })]) : [null, []];

  if (!profile) notFound();

  return (
    <PageShell eyebrow="Traveler" title={profile.display_name ?? "Passport traveler"} copy={profile.home_city ? `Based in ${profile.home_city}.` : "A Gay Bar Passport community profile."}>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <p className="text-sm text-muted-foreground">
          {profile.followerCount} follower(s) · {profile.followingCount} following
        </p>
        {profile.id !== user?.id ? <FollowButton profileId={profile.id} isFollowing={profile.isFollowing} /> : null}
      </div>
      <div className="space-y-5">
        {entries.length ? (
          entries.map((entry) => <SocialEntryCard key={entry.id} entry={entry} />)
        ) : (
          <Card className="bg-card/90 p-6">
            <BookOpen className="h-5 w-5 text-terracotta" aria-hidden="true" />
            <p className="mt-4 font-semibold">No public journal entries yet.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Private entries stay out of community spaces.</p>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
