import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createModerationFlag, updateJournalModeration } from "@/features/admin/actions";
import { listAdminJournals } from "@/services/admin";

export default async function AdminJournalsPage() {
  const journals = await listAdminJournals();

  return (
    <div>
      <Badge>Journals</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Public journal moderation.</h1>
      <div className="mt-8 space-y-4">
        {journals.map((entry) => (
          <Card key={entry.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold">{entry.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{entry.profiles?.display_name ?? "Traveler"} · {entry.city}, {entry.country}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{entry.moderation_status}</Badge>
                  <Badge>{entry.is_private ? "private" : "public"}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["active", "hidden", "flagged"] as const).map((status) => (
                  <form key={status} action={updateJournalModeration.bind(null, entry.id, status)}>
                    <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{status}</button>
                  </form>
                ))}
                <form action={createModerationFlag.bind(null, "journal", entry.id, "Journal flagged for review")}>
                  <button className="rounded-md border border-terracotta/50 bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Flag</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
