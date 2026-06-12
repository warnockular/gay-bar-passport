import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createImportBatch } from "@/features/admin/actions";
import { listImportBatches } from "@/services/admin";

export default async function AdminImportsPage() {
  const batches = await listImportBatches();

  return (
    <div>
      <Badge>Imports</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Import pipeline foundation.</h1>
      <Card className="mt-8 bg-card/90 p-6">
        <h2 className="font-serif text-3xl font-semibold">Create empty tracking batch</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">This records import intent only. It does not import provider data or create production venues.</p>
        <form action={createImportBatch} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input name="sourceType" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Source type, e.g. future_google_places" required />
          <input name="sourceName" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Source name" required />
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Create batch</button>
        </form>
      </Card>
      <div className="mt-8 space-y-4">
        {batches.length ? (
          batches.map((batch) => (
            <Card key={batch.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Link href={`/admin/imports/${batch.id}`} className="font-serif text-2xl font-semibold hover:text-primary">
                    {batch.source_name}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">{batch.source_type} · created {new Date(batch.created_at).toLocaleString()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{batch.status}</Badge>
                    <Badge>{batch.imported_count} staged</Badge>
                    <Badge>{batch.approved_count} approved</Badge>
                    <Badge>{batch.rejected_count} rejected</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Started: {batch.started_at ?? "not started"}<br />
                  Completed: {batch.completed_at ?? "not completed"}
                </p>
              </div>
            </Card>
          ))
        ) : (
          <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No import batches have been created.</Card>
        )}
      </div>
    </div>
  );
}
