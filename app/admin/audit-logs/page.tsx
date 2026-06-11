import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAuditLogs } from "@/services/admin";

export default async function AdminAuditLogsPage() {
  const logs = await listAuditLogs();

  return (
    <div>
      <Badge>Audit Logs</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Administrative audit trail.</h1>
      <div className="mt-8 space-y-4">
        {logs.length ? logs.map((log) => (
          <Card key={log.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{log.action}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{log.target_type} · {log.target_id ?? "platform"}</p>
                <pre className="mt-3 overflow-auto rounded-md bg-background/70 p-3 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
              </div>
              <Badge>{new Date(log.created_at).toLocaleString()}</Badge>
            </div>
          </Card>
        )) : <Card className="bg-card/90 p-6">Audit events appear after admin actions.</Card>}
      </div>
    </div>
  );
}
