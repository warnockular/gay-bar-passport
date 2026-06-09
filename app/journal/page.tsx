import { BookOpen, CalendarDays, PenLine } from "lucide-react";
import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PageShell } from "@/components/layout/page-shell";
import { PreviewPanel } from "@/components/landing/preview-panel";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function JournalPage() {
  await requireUser();

  return (
    <PageShell
      eyebrow="Journal"
      title="A writing surface for nights worth remembering."
      copy="Phase 2 creates the protected journal route and database table. Entry creation and editing remain future work."
    >
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <div className="grid gap-5 md:grid-cols-3">
        <PreviewPanel icon={PenLine} title="Notes" copy="Future travelers can write venue memories and trip reflections." detail="Table created." />
        <PreviewPanel icon={CalendarDays} title="Trips" copy="Entries can later attach to trips, dates, cities, and venue visits." detail="Relationships ready." />
        <PreviewPanel icon={BookOpen} title="Archive" copy="A refined reading view can surface past journeys and favorites." detail="Protected shell." />
      </div>
    </PageShell>
  );
}
