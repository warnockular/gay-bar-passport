import Link from "next/link";
import type { ReactNode } from "react";
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
  venue_archived: "Venue archived",
  venue_archived_after_merge: "Venue archived after merge",
  venue_duplicate_candidate_dismissed: "Duplicate review dismissed",
  venue_duplicate_candidate_merged: "Duplicate review marked merged",
  venue_duplicate_candidates_generated: "Duplicate candidates generated",
  venue_duplicate_merged: "Merged Duplicate Venue",
  venue_featured: "Venue marked as featured",
  venue_identity_changed: "Venue identity classification changed",
  venue_import_approved: "Staged venue approved",
  venue_import_merge_marked: "Staged venue marked for merge",
  venue_import_rejected: "Staged venue rejected",
  venue_metadata_updated: "Venue metadata updated",
  venue_owner_linked: "Venue owner linked",
  venue_quality_recalculated: "Venue quality recalculated",
  venue_readiness_recalculated: "Venue readiness recalculated",
  venue_rejected: "Venue submission rejected",
  venue_source_changed: "Venue source details changed",
  venue_status_changed: "Venue review status changed",
  venue_traveler_tags_updated: "Venue traveler tags updated",
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

function venueLocation(venue?: { city?: string | null; country?: string | null } | null) {
  return [venue?.city, venue?.country].filter(Boolean).join(", ");
}

function VenueReference({ venue }: { venue?: { city?: string | null; country?: string | null; id: string; name: string } | null }) {
  if (!venue) return <span className="text-muted-foreground">Unknown venue</span>;
  const location = venueLocation(venue);

  return (
    <span>
      <Link className="font-semibold text-primary hover:underline" href={`/admin/venues/${venue.id}`}>{venue.name}</Link>
      {location ? <span className="text-muted-foreground"> · {location}</span> : null}
    </span>
  );
}

function targetLabel(log: AdminAuditLog) {
  if (log.target_type === "venue_duplicate_candidate" && log.duplicateCandidate) {
    return (
      <span>
        Duplicate Review: <VenueReference venue={log.duplicateCandidate.venueA} /> <span className="text-muted-foreground">↔</span> <VenueReference venue={log.duplicateCandidate.venueB} />
      </span>
    );
  }

  if (log.target_type === "venue" && log.venue) {
    return <VenueReference venue={log.venue} />;
  }

  return log.target_id ? humanize(log.target_type) : "Platform";
}

function actorLabel(log: AdminAuditLog) {
  if (!log.actor_id) return "System";
  return log.actor?.display_name ?? "Unknown admin";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(value)).replace(" at ", " at ");
}

function isTechnicalKey(key: string) {
  return key.toLowerCase().endsWith("id") || ["sourceVenueId", "targetVenueId", "mergeRecordId", "existingVenueId", "venueId"].includes(key);
}

function readableReason(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value)) return value.map((item) => metadataValueLabel(item));
  if (typeof value === "string") return value.split(",").map((part) => metadataValueLabel(part.trim())).filter(Boolean);
  return [metadataValueLabel(value)];
}

function storyRows(log: AdminAuditLog) {
  const metadata = metadataEntries(log.metadata);
  const metadataObject = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata) ? log.metadata : {};
  const sourceVenueId = typeof metadataObject.sourceVenueId === "string" ? metadataObject.sourceVenueId : null;
  const targetVenueId = typeof metadataObject.targetVenueId === "string" ? metadataObject.targetVenueId : null;
  const existingVenueId = typeof metadataObject.existingVenueId === "string" ? metadataObject.existingVenueId : null;
  const venueId = typeof metadataObject.venueId === "string" ? metadataObject.venueId : null;
  const rows: Array<{ label: string; value: ReactNode }> = [];

  if (sourceVenueId) rows.push({ label: "Archived Venue", value: <VenueReference venue={log.venueRefs[sourceVenueId]} /> });
  if (targetVenueId) rows.push({ label: "Kept Venue", value: <VenueReference venue={log.venueRefs[targetVenueId]} /> });
  if (existingVenueId) rows.push({ label: "Existing Venue", value: <VenueReference venue={log.venueRefs[existingVenueId]} /> });
  if (!sourceVenueId && !targetVenueId && venueId) rows.push({ label: "Venue", value: <VenueReference venue={log.venueRefs[venueId]} /> });
  if (log.target_type === "venue" && log.venue && !rows.some((row) => row.label === "Venue")) rows.push({ label: "Venue", value: <VenueReference venue={log.venue} /> });
  if (log.duplicateCandidate) {
    rows.push({ label: "Duplicate Review", value: <><VenueReference venue={log.duplicateCandidate.venueA} /> <span className="text-muted-foreground">↔</span> <VenueReference venue={log.duplicateCandidate.venueB} /></> });
    if (log.duplicateCandidate.match_reasons.length) {
      rows.push({ label: "Match Reasons", value: log.duplicateCandidate.match_reasons.map((reason) => metadataValueLabel(reason)).join(", ") });
    }
  }

  metadata.filter(([key]) => !isTechnicalKey(key)).forEach(([key, value]) => {
    if (key === "reason") {
      const reasons = readableReason(value);
      if (reasons?.length) rows.push({ label: "Reason", value: reasons.join(", ") });
      return;
    }
    rows.push({ label: metadataKeyLabel(key), value: metadataValueLabel(value) });
  });

  return rows;
}

function technicalRows(log: AdminAuditLog) {
  const rows: Array<[string, unknown]> = [];
  if (log.actor_id) rows.push(["Actor ID", log.actor_id]);
  if (log.target_id) rows.push([`${humanize(log.target_type)} ID`, log.target_id]);
  metadataEntries(log.metadata).filter(([key]) => isTechnicalKey(key)).forEach(([key, value]) => rows.push([metadataKeyLabel(key), value]));
  return rows;
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
          const story = storyRows(log);
          const technical = technicalRows(log);

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
                      <dd className="mt-1 text-muted-foreground">{actorLabel(log)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">Target</dt>
                      <dd className="mt-1 text-muted-foreground">
                        {targetLabel(log)}
                      </dd>
                    </div>
                  </dl>
                  {story.length ? (
                    <dl className="mt-4 divide-y divide-border rounded-md border border-border bg-background/60">
                      {story.map((row) => (
                        <div key={row.label} className="grid gap-1 p-3 text-sm sm:grid-cols-[180px_1fr]">
                          <dt className="font-medium text-foreground">{row.label}</dt>
                          <dd className="break-words text-muted-foreground">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-4 rounded-md border border-border bg-background/60 p-3 text-sm text-muted-foreground">No extra details were recorded for this action.</p>
                  )}
                  {technical.length ? (
                    <details className="mt-4 rounded-md border border-border bg-background/50 p-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-muted-foreground">Show Technical Details</summary>
                      <dl className="mt-3 space-y-2">
                        {technical.map(([key, value]) => (
                          <div key={`${log.id}-${key}`} className="grid gap-1 sm:grid-cols-[180px_1fr]">
                            <dt className="font-medium text-foreground">{key}</dt>
                            <dd className="break-all text-muted-foreground">{metadataValueLabel(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ) : null}
                </div>
                <Badge>{formatTimestamp(log.created_at)}</Badge>
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
