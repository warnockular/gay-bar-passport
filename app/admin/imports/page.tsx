import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createImportBatch, importCuratedCsvToStaging } from "@/features/admin/actions";
import { listImportBatches } from "@/services/admin";

type AdminImportsPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminImportsPage({ searchParams }: AdminImportsPageProps) {
  const params = (await searchParams) ?? {};
  const batches = await listImportBatches();

  return (
    <div>
      <Badge>Imports</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Import pipeline foundation.</h1>
      {params.error ? (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
          Import setup failed: {params.error === "missing-csv" ? "Add a source name and paste or upload CSV data." : params.error}
        </p>
      ) : null}
      <Card className="mt-8 bg-card/90 p-6">
        <h2 className="font-serif text-3xl font-semibold">Google Places preview</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Search Google Places server-side, preview NYC candidates, then stage selected results for review.
        </p>
        <Link className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href="/admin/imports/google">
          Open Google import
        </Link>
      </Card>
      <Card className="mt-8 bg-card/90 p-6">
        <h2 className="font-serif text-3xl font-semibold">Stage curated CSV</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Paste or upload curated venue candidates. Valid rows are stored in import staging only and will not appear publicly.
        </p>
        <form action={importCuratedCsvToStaging} className="mt-5 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Source type
              <input name="sourceType" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" defaultValue="curated_csv" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Source name
              <input name="sourceName" className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm" placeholder="Montreal field test seed list" required />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Upload CSV file
            <input name="csvFile" type="file" accept=".csv,text/csv" className="rounded-md border border-input bg-background/80 px-3 py-2 text-sm" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Or paste CSV data
            <textarea
              name="csvData"
              className="min-h-44 rounded-md border border-input bg-background/80 px-3 py-2 font-mono text-xs"
              placeholder="name,category,address,neighborhood,city,region,country,postal_code,latitude,longitude,website_url,phone,image_url,opening_hours,description,source,source_id,source_url,suggested_tags"
            />
          </label>
          <p className="text-xs leading-5 text-muted-foreground">
            Required columns: name, city, country. Invalid rows are reported without blocking valid rows.
          </p>
          <button className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">
            Stage CSV rows
          </button>
        </form>
      </Card>
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
                    <Badge>{batch.staged_count || batch.imported_count} staged</Badge>
                    <Badge>{batch.invalid_count} invalid</Badge>
                    <Badge>{batch.total_count || batch.imported_count} total</Badge>
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
