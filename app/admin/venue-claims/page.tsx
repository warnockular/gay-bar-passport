import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { reviewVenueClaim } from "@/features/admin/actions";
import { listVenueClaims } from "@/services/admin";
import type { Tables } from "@/types/database";

type AdminVenueClaimsPageProps = {
  searchParams?: Promise<{ status?: string; updated?: string }>;
};

const statusFilters: Array<{ label: string; value: Tables<"venue_claims">["status"] | "all" }> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All claims", value: "all" }
];

function isClaimStatus(value?: string): value is Tables<"venue_claims">["status"] | "all" {
  return statusFilters.some((filter) => filter.value === value);
}

function label(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusMessage({ updated }: { updated?: string }) {
  if (!updated) return null;
  const message = updated === "claim-approved" ? "Claim approved and owner linked." : updated === "claim-rejected" ? "Claim rejected." : "Claim could not be reviewed.";
  return (
    <p className="mt-4 flex items-center gap-2 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {message}
    </p>
  );
}

export default async function AdminVenueClaimsPage({ searchParams }: AdminVenueClaimsPageProps) {
  const params = await searchParams;
  const status = isClaimStatus(params?.status) ? params.status : "pending";
  const claims = await listVenueClaims(status);
  const feedbackPath = `/admin/venue-claims?status=${status}`;

  return (
    <div>
      <Badge>Ownership Claims</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Venue ownership review.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Review venue owner requests before linking profiles to venue records. Approved claims set owner verification and preserve an audit trail.
      </p>
      <StatusMessage updated={params?.updated} />

      <div className="mt-6 flex flex-wrap gap-2">
        {statusFilters.map((item) => (
          <Link key={item.value} href={`/admin/venue-claims?status=${item.value}`} className={`rounded-md border border-border px-3 py-2 text-sm font-semibold ${status === item.value ? "bg-primary text-primary-foreground" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {claims.length ? claims.map((claim) => (
          <Card key={claim.id} className="bg-card/90 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl font-semibold">{claim.venue?.name ?? "Unknown venue"}</h2>
                  <Badge>{label(claim.status)}</Badge>
                  {claim.venue?.verification_status ? <Badge>{label(claim.venue.verification_status)}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {claim.venue ? `${claim.venue.city}, ${claim.venue.country}` : "Venue record unavailable"} · Requested {new Date(claim.created_at).toLocaleString()}
                </p>
                <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Claimant</dt>
                    <dd className="mt-1 text-muted-foreground">{claim.claimant_name} · {claim.role_title ?? "Role not provided"}</dd>
                    <dd className="mt-1 text-xs text-muted-foreground">{claim.claimant_email}</dd>
                    <dd className="mt-1 text-xs text-muted-foreground">Profile: {claim.claimant?.display_name ?? "Unnamed profile"} · {claim.claimant_id}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Evidence</dt>
                    <dd className="mt-1 text-muted-foreground">
                      {claim.evidence_url ? <a href={claim.evidence_url} className="text-primary hover:underline" target="_blank" rel="noreferrer">Open proof URL</a> : "No proof URL provided"}
                    </dd>
                    {claim.venue ? <dd className="mt-1"><Link className="text-primary hover:underline" href={`/admin/venues/${claim.venue.id}`}>Open venue management</Link></dd> : null}
                  </div>
                </dl>
                <div className="mt-5 rounded-md border border-border bg-background/70 p-4">
                  <p className="text-sm font-semibold">Claim notes</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{claim.notes ?? "No notes provided."}</p>
                </div>
                {claim.reviewed_at ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Reviewed {new Date(claim.reviewed_at).toLocaleString()} by {claim.reviewer?.display_name ?? claim.reviewed_by ?? "admin"}.
                  </p>
                ) : null}
              </div>
              {claim.status === "pending" ? (
                <div className="w-full max-w-sm space-y-3">
                  <form action={reviewVenueClaim.bind(null, claim.id, "approved")}>
                    <input type="hidden" name="feedbackPath" value={feedbackPath} />
                    <textarea name="reviewNotes" className="mb-2 min-h-20 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" placeholder="Review note optional" />
                    <button className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" type="submit">Approve and link owner</button>
                  </form>
                  <form action={reviewVenueClaim.bind(null, claim.id, "rejected")}>
                    <input type="hidden" name="feedbackPath" value={feedbackPath} />
                    <textarea name="reviewNotes" className="mb-2 min-h-20 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" placeholder="Rejection reason optional" />
                    <button className="w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Reject claim</button>
                  </form>
                </div>
              ) : null}
            </div>
          </Card>
        )) : (
          <Card className="bg-card/90 p-6 text-sm text-muted-foreground">No ownership claims match this view.</Card>
        )}
      </div>
    </div>
  );
}
