import { BarChart3, MapPinned, Stamp } from "lucide-react";
import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageShell } from "@/components/layout/page-shell";
import { PreviewPanel } from "@/components/landing/preview-panel";
import { VisitPreview } from "@/features/visits/visit-preview";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <PageShell
      eyebrow="Dashboard"
      title="A calm command center for future travel insight."
      copy="Phase 2 protects this route, reads the active Supabase user, and prepares authenticated visit data for future analytics."
    >
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Session</p>
          <p className="mt-2 text-lg">{user?.email ?? "Setup mode traveler"}</p>
        </div>
        {isSupabaseConfigured ? <SignOutButton /> : null}
      </div>
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <PreviewPanel icon={Stamp} title="Stamps" copy="Collectible visit markers will summarize progress by city and venue." detail="Schema created." />
        <PreviewPanel icon={MapPinned} title="Cities" copy="Future city coverage can show where the traveler has explored most." detail="Profiles and visits ready." />
        <PreviewPanel icon={BarChart3} title="Patterns" copy="Analytics can reveal venue types, trip cadence, and destination trends." detail="Query layer prepared." />
      </div>
      <div className="mt-6">
        <VisitPreview />
      </div>
    </PageShell>
  );
}
