import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { resolveModerationFlag } from "@/features/admin/actions";
import { listModerationFlags } from "@/services/admin";

export default async function AdminReportsPage() {
  const flags = await listModerationFlags();

  return (
    <div>
      <Badge>Reports</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Flagged content review.</h1>
      <div className="mt-8 space-y-4">
        {flags.length ? flags.map((flag) => (
          <Card key={flag.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{flag.target_type}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{flag.reason}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{flag.status}</Badge>
                  <Badge>{new Date(flag.created_at).toLocaleString()}</Badge>
                </div>
              </div>
              {flag.status === "open" ? (
                <div className="flex flex-wrap gap-2">
                  <form action={resolveModerationFlag.bind(null, flag.id, "resolved")}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Resolve</button>
                  </form>
                  <form action={resolveModerationFlag.bind(null, flag.id, "dismissed")}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Dismiss</button>
                  </form>
                </div>
              ) : null}
            </div>
          </Card>
        )) : <Card className="bg-card/90 p-6">No reports are open.</Card>}
      </div>
    </div>
  );
}
