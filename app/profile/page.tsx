import Link from "next/link";
import { BarChart3, BookOpen, Heart, KeyRound, LogOut, Stamp } from "lucide-react";
import type { Metadata } from "next";
import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PageShell } from "@/components/layout/page-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/profile-form";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureProfile } from "@/services/profiles";

export const metadata: Metadata = {
  title: "Profile | Gay Bar Passport",
  robots: { index: false, follow: false }
};

const travelLinks = [
  {
    copy: "Saved places for future trips, recommendations, and return visits.",
    href: "/favorites",
    icon: Heart,
    label: "Favorites",
    meta: "Saved Venues"
  },
  {
    copy: "Your stamps, visits, and travel history.",
    href: "/passport",
    icon: Stamp,
    label: "Passport",
    meta: "Travel History"
  },
  {
    copy: "Private notes and memories from your visits.",
    href: "/journal",
    icon: BookOpen,
    label: "Journal",
    meta: "Personal Archive"
  },
  {
    copy: "Private insights from your travel activity.",
    href: "/analytics",
    icon: BarChart3,
    label: "Travel Analytics",
    meta: "Insights"
  }
];

export default async function ProfilePage() {
  const user = await requireUser();

  if (!user) {
    return (
      <PageShell
        eyebrow="Profile"
        title="Your traveler profile will live here."
        copy="Sign in to manage your traveler identity, saved places, and account settings."
      >
        <ConfigurationCallout />
      </PageShell>
    );
  }

  const profile = await ensureProfile(user.id, user.email?.split("@")[0]);

  return (
    <PageShell
      eyebrow="Profile"
      title="Your Passport Profile"
      copy="Manage your traveler identity, saved places, and account settings."
    >
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} email={user.email ?? "Unknown email"} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">My Travel</h2>
            <div className="mt-5 grid gap-3">
              {travelLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="rounded-md border border-border bg-background/70 p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-1 h-5 w-5 shrink-0 text-rose" aria-hidden="true" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.meta}</p>
                        <h3 className="mt-1 font-serif text-xl font-semibold">{item.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>

          <Card className="bg-card/90 p-5">
            <h2 className="font-serif text-2xl font-semibold">Account</h2>
            <div className="mt-4 rounded-md border border-border bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</p>
              <p className="mt-1 text-sm font-semibold">Signed in as {user.email ?? "your account"}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-background/70 px-4 py-2 text-sm font-semibold hover:bg-muted" href="/auth/reset-password">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Reset password
              </Link>
              <div className="[&_button]:w-full">
                <SignOutButton />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Use sign out when you are finished on a shared device.
            </p>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
