import Link from "next/link";
import { BarChart3, Camera, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PageShell } from "@/components/layout/page-shell";
import { PreviewPanel } from "@/components/landing/preview-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/features/profile/profile-form";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { ensureProfile } from "@/services/profiles";

export const metadata: Metadata = {
  title: "Profile | Gay Bar Passport",
  robots: { index: false, follow: false }
};

export default async function ProfilePage() {
  const user = await requireUser();

  if (!user) {
    return (
      <PageShell
        eyebrow="Profile"
        title="Your traveler profile will live here."
        copy="Configure Supabase locally or in Vercel to enable authenticated profile management."
      >
        <ConfigurationCallout />
      </PageShell>
    );
  }

  const profile = await ensureProfile(user.id, user.email?.split("@")[0]);

  return (
    <PageShell
      eyebrow="Profile"
      title="Shape the identity stamped inside your passport."
      copy="Phase 3 gives every traveler an account profile, avatar, home city, and session-aware account controls."
    >
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="bg-card/90">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Traveler details</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} email={user.email ?? "Unknown email"} />
          </CardContent>
        </Card>
        <div className="space-y-5">
          <PreviewPanel
            icon={ShieldCheck}
            title="Session"
            copy="Protected app routes now require an active Supabase session before revealing personal spaces."
            detail="Active account"
          />
          <PreviewPanel
            icon={Camera}
            title="Avatar"
            copy="Uploads are stored in the avatars bucket with owner-scoped write policies."
            detail="2 MB limit"
          />
          <PreviewPanel
            icon={BarChart3}
            title="Analytics"
            copy="Your visits, stamps, journals, and mapped destinations now have a private insight dashboard."
            detail="Personal travel data"
          />
          <Link className="text-sm font-semibold text-primary hover:underline" href="/analytics">
            View travel analytics
          </Link>
          <Link className="text-sm font-semibold text-primary hover:underline" href="/auth/reset-password">
            Reset your password
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
