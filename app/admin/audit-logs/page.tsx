import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAuditLogs, type AuditLogFilters, type AdminAuditLog } from "@/services/admin";
import type { Json } from "@/types/database";

const actionLabels: Record<string, string> = {
  comment_moderation_changed: "Comment moderation changed",
  comment_removed: "Comment removed",
  content_flagged: "Content flagged for review",
  import_batch_created: "Import batch created",
  journal_moderation_changed: "Journal moderation changed",
  moderation_flag_closed: "Moderation report closed",
  role_change: "User role changed",
  user_reinstated: "User reinstated",
  user_soft_deleted: "User soft deleted",
  user_suspended: "User suspended",
  venue_bulk_operation_draft_created: "Venue bulk operation draft created",
  venue_claim_approved: "Venue ownership claim approved",
  venue_claim_rejected: "Venue ownership claim rejected",
  venue_claim_requested: "Venue ownership claim requested",
  venue_community_submitted: "Venue submitted by community member",
  venue_archived_after_merge: "Venue archived after merge",
  venue_duplicate_candidate_dismissed: "Duplicate candidate dismissed",
  venue_duplicate_candidate_merged: "Duplicate candidate merged",
  venue_duplicate_candidates_generated: "Duplicate candidates generated",
  venue_duplicate_merged: "Duplicate venue merged",
  venue_featured: "Venue marked as featured",
  venue_identity_changed: "Venue identity classification changed",
  venue_import_approved: "Staged venue approved",
  venue_import_merge_marked: "Staged venue marked for merge",
  venue_import_rejected: "Staged venue rejected",
  venue_metadata_updated: "Venue metadata updated",
  venue_owner_linked: "Venue owner linked",
  venue_quality_recalculated: "Venue quality recalculated",
  venue_readiness_recalculated: "Venue readiness recalculated",
  venue_source_changed: "Venue source details changed",
  venue_status_changed: "Venue review status changed",
  venue_unfeatured: "Venue removed from featured",
  venue_verification_changed: "Venue verification changed"
};

const actionOptions = Object.keys(actionLabels).sort((a, b) => actionLabels[a].localeCompare(actionLabels[b]));
const targetTypeOptions = ["comment", "import_batch", "journal", "report", "user", "venue", "venue_bulk_operation", "venue_claim", "venue_duplicate_candidate", "venue_import_staging", "venue_merge"];

function humanize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\bid\b/gi, "ID")
    .replace(/\blgbtq\b/gi, "LGBTQ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function actionLabel(action: string) {
  return actionLabels[action] ?? humanize(action);
}

function metadataKeyLabel(key: string) {
  const labels: Record<string, string> = {
    batchId: "Import batch ID",
    claimId: "Claim ID",
    claimantId: "Claimant ID",
    claimantName: "Claimant name",
    classification: "Identity classification",
    created: "Candidates created",
    existingVenueId: "Existing venue ID",
    operationType: "Operation type",
    reason: "Reason",
    mergeRecordId: "Merge record ID",
    reviewNotes: "Review notes",
    roleTitle: "Role title",
    score: "Verification score",
    source: "Source",
    sourceId: "Source ID",
    sourceName: "Source name",
    sourceType: "Source type",
    status: "Status",
    submissionStatus: "Submission status",
    venueId: "Venue ID"
  };

  return labels[key] ?? humanize(key.replace(/([a-z])([A-Z])/g, "$1 $2"));
}

function metadataValueLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.includes("_") ? humanize(value) : value;
  return JSON.stringify(value);
}

function metadataEntries(metadata: Json) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  return Object.entries(metadata).filter(([, value]) => value !== null && value !== undefined);
}

function targetLabel(log: AdminAuditLog) {
  if (log.target_type === "venue" && log.venue) {
    const location = [log.venue.city, log.venue.country].filter(Boolean).join(", ");
    return location ? `${log.venue.name} · ${location}` : log.venue.name;
  }

  return log.target_id ? humanize(log.target_type) : "Platform";
}

type AdminAuditLogsPageProps = {
  searchParams?: Promise<{
    action?: string;
    order?: string;
    targetType?: string;
  }>;
};

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const params = (await searchParams) ?? {};
  const filters: AuditLogFilters = {
    action: params.action || undefined,
    order: params.order === "oldest" ? "oldest" : "newest",
    targetType: params.targetType || undefined
  };
  const logs = await listAuditLogs(filters);

  return (
    <div>
      <Badge>Audit Logs</Badge>
      <h1 className="mt-5 font-serif text-4xl font-semibold sm:text-5xl">Administrative audit trail.</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Review moderation, venue, user, and import actions in plain language while keeping technical IDs available for troubleshooting.
      </p>

      <Card className="mt-8 bg-card/90 p-5">
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_160px_auto]" action="/admin/audit-logs">
          <label className="grid gap-2 text-sm font-medium">
            Action type
            <select name="action" defaultValue={filters.action ?? ""} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>{actionLabel(action)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Target type
            <select name="targetType" defaultValue={filters.targetType ?? ""} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="">All targets</option>
              {targetTypeOptions.map((targetType) => (
                <option key={targetType} value={targetType}>{humanize(targetType)}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Order
            <select name="order" defaultValue={filters.order} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit">Apply</Button>
            <a className={buttonVariants({ variant: "outline" })} href="/admin/audit-logs">Reset</a>
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {logs.length ? logs.map((log) => {
          const metadata = metadataEntries(log.metadata);

          return (
            <Card key={log.id} className="bg-card/90 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-2xl font-semibold">{actionLabel(log.action)}</h2>
                    <Badge className="bg-background/70">{humanize(log.target_type)}</Badge>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="font-medium text-foreground">Actor</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {log.actor?.display_name ?? (log.actor_id ? "Unknown admin" : "System")}
                        {log.actor_id ? <span className="block text-xs">ID: {log.actor_id}</span> : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Target</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {targetLabel(log)}
                        {log.target_id ? <span className="block break-all text-xs">ID: {log.target_id}</span> : null}
                      </dd>
                    </div>
                  </dl>
                  {metadata.length ? (
                    <dl className="mt-4 divide-y divide-border rounded-md border border-border bg-background/60">
                      {metadata.map(([key, value]) => (
                        <div key={key} className="grid gap-1 p-3 text-sm sm:grid-cols-[180px_1fr]">
                          <dt className="font-medium text-foreground">{metadataKeyLabel(key)}</dt>
                          <dd className="break-words text-muted-foreground">{metadataValueLabel(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">No extra details were recorded for this action.</p>
                  )}
                </div>
                <Badge>{new Date(log.created_at).toLocaleString()}</Badge>
              </div>
            </Card>
          );
        }) : (
          <Card className="bg-card/90 p-6">Audit events appear after admin actions.</Card>
        )}
      </div>
    </div>
  );
}
