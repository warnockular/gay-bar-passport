import { ConfigurationCallout } from "@/components/auth/configuration-callout";
import { PassportStamp } from "@/components/landing/passport-stamp";
import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function PassportPage() {
  await requireUser();

  return (
    <PageShell
      eyebrow="Passport"
      title="A premium stamp book, waiting for real visits."
      copy="Phase 2 adds the protected route and passport stamp table. Stamp earning logic and visit logging stay reserved for the next product phase."
    >
      {!isSupabaseConfigured ? <div className="mb-6"><ConfigurationCallout /></div> : null}
      <Card className="passport-border bg-card/85 p-6 md:p-10">
        <div className="grid gap-6 sm:grid-cols-3">
          <PassportStamp city="LIS" date="ISSUED" tone="sage" />
          <PassportStamp city="CDMX" date="SAMPLE" tone="terracotta" />
          <PassportStamp city="CPH" date="DRAFT" tone="rose" />
        </div>
      </Card>
    </PageShell>
  );
}
