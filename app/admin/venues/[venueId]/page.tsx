import { AlertCircle, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  updateVenueFeatured,
  updateVenueIdentityClassification,
  updateVenueMetadata,
  updateVenueSource,
  updateVenueStatus,
  updateVenueTravelerTags,
  updateVenueVerification,
  reviewVenueClaim
} from "@/features/admin/actions";
import { VenueImagePreview } from "@/features/venues/venue-image-preview";
import { travelerTagOptions, travelerTagSlugs } from "@/lib/traveler-tags";
import { venueCategoryOptions } from "@/lib/venue-categories";
import { getAdminVenue, listAdminVenueTags, listVenueClaimsForVenue } from "@/services/admin";
import type { Tables } from "@/types/database";

type AdminVenuePageProps = {
  params: Promise<{ venueId: string }>;
  searchParams?: Promise<{ error?: string; updated?: string }>;
};

type Venue = Tables<"venues">;

const reviewStatusOptions: Venue["review_status"][] = ["active", "hidden", "pending_review"];
const verificationOptions: Array<{ label: string; score: number; value: Venue["verification_status"] }> = [
  { label: "Unverified", score: 0, value: "unverified" },
  { label: "Community Verified", score: 80, value: "community_verified" },
  { label: "Owner Verified", score: 90, value: "owner_verified" },
  { label: "Admin Verified", score: 100, value: "admin_verified" }
];
const identityOptions: Array<{ label: string; value: Venue["identity_classification"] }> = [
  { label: "LGBTQ Venue", value: "lgbtq_venue" },
  { label: "LGBTQ Friendly", value: "lgbtq_friendly" },
  { label: "Historic Site", value: "historic_site" },
  { label: "Community Recommended", value: "community_recommended" }
];
const submissionStatusOptions: Venue["submission_status"][] = ["imported", "community_submitted", "owner_submitted", "admin_created"];

function label(value: string) {
  return value
    .split("_")
    .map((part) => (part.toLowerCase() === "lgbtq" ? "LGBTQ" : part.slice(0, 1).toUpperCase() + part.slice(1)))
    .join(" ");
}

function StatusMessage({ updated, section }: { section: string; updated?: string }) {
  if (updated !== section) return null;
  return (
    <p className="mt-4 flex items-center gap-2 rounded-md border border-sage/30 bg-sage/10 p-3 text-sm font-semibold text-sage" role="status">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      Changes saved.
    </p>
  );
}

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive" role="alert">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {error}
    </p>
  );
}

function Field({ children, label: fieldLabel }: { children: React.ReactNode; label: string }) {
  return (
    <label className="space-y-2 text-sm font-semibold">
      <span>{fieldLabel}</span>
      {children}
    </label>
  );
}

function InputClass() {
  return "h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm";
}

export default async function AdminVenuePage({ params, searchParams }: AdminVenuePageProps) {
  const { venueId } = await params;
  const { error, updated } = (await searchParams) ?? {};
  const [venue, claims, venueTags] = await Promise.all([getAdminVenue(venueId), listVenueClaimsForVenue(venueId), listAdminVenueTags(venueId)]);
  if (!venue) notFound();

  const feedbackPath = `/admin/venues/${venue.id}`;
  const isFeaturedReady = venue.readiness_status === "featured_ready";
  const pendingClaims = claims.filter((claim) => claim.status === "pending");
  const assignedTagSlugs = new Set(venueTags.map((tag) => tag.slug));
  const managedTagSlugs = new Set<string>(travelerTagSlugs);
  const unmanagedTags = venueTags.filter((tag) => !managedTagSlugs.has(tag.slug));

  return (
    <div className="space-y-6">
      <section>
        <Badge>Venue Management</Badge>
        <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight md:text-5xl">{venue.name}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge>{label(venue.category)}</Badge>
          <Badge>{label(venue.review_status)}</Badge>
          <Badge>{label(venue.readiness_status)}</Badge>
          <Badge>{venue.completeness_score}/100 Complete</Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{venue.city}, {venue.country}</p>
        <ErrorMessage error={error} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Venue Editing Dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Manage the practical fields travelers see first: identity, location, media, hours, and description.</p>
            <form action={updateVenueMetadata.bind(null, venue.id)} className="mt-6 space-y-8">
              <input type="hidden" name="feedbackPath" value={feedbackPath} />
              <input type="hidden" name="publicPath" value={`/venues/${venue.slug}`} />
              <section>
                <h3 className="font-serif text-2xl font-semibold">Basic Information</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Name">
                    <input name="name" defaultValue={venue.name} className={InputClass()} />
                  </Field>
                  <Field label="Type">
                    <select name="category" defaultValue={venue.category} className={InputClass()}>
                      {venueCategoryOptions.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Website">
                    <input name="websiteUrl" defaultValue={venue.website_url ?? ""} className={InputClass()} />
                  </Field>
                </div>
              </section>

              <section id="location">
                <h3 className="font-serif text-2xl font-semibold">Location</h3>
                <p className="mt-2 text-sm text-muted-foreground">Coordinates power future map and directions experiences. Leave blank if unknown.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Address">
                    <input name="address" defaultValue={venue.address ?? ""} className={InputClass()} />
                  </Field>
                  <Field label="Neighborhood">
                    <input name="neighborhood" defaultValue={venue.neighborhood ?? ""} className={InputClass()} />
                  </Field>
                  <Field label="City">
                    <input name="city" defaultValue={venue.city} className={InputClass()} />
                  </Field>
                  <Field label="State / Province / Territory">
                    <input name="region" defaultValue={venue.region ?? ""} className={InputClass()} />
                  </Field>
                  <Field label="Country">
                    <input name="country" defaultValue={venue.country} className={InputClass()} />
                  </Field>
                  <Field label="Latitude">
                    <input name="latitude" defaultValue={venue.latitude ?? ""} inputMode="decimal" className={InputClass()} />
                  </Field>
                  <Field label="Longitude">
                    <input name="longitude" defaultValue={venue.longitude ?? ""} inputMode="decimal" className={InputClass()} />
                  </Field>
                </div>
              </section>

              <section>
                <h3 className="font-serif text-2xl font-semibold">Photos & Media</h3>
                <VenueImagePreview imageUrl={venue.image_url} alt={`${venue.name} primary venue image preview`} className="mt-4 h-56" mode="admin" />
                <div className="mt-4">
                  <Field label="Primary image URL">
                    <input name="imageUrl" defaultValue={venue.image_url ?? ""} className={InputClass()} placeholder="https://images.unsplash.com/..." />
                  </Field>
                  <p className="mt-2 text-xs text-muted-foreground">Clear this field and save to remove the current image. Direct uploads remain a future enhancement.</p>
                </div>
              </section>

              <section>
                <h3 className="font-serif text-2xl font-semibold">Hours & Description</h3>
                <div className="mt-4 grid gap-4">
                  <Field label="Opening hours">
                    <input name="openingHours" defaultValue={venue.opening_hours ?? ""} className={InputClass()} />
                  </Field>
                  <label className="space-y-2 text-sm font-semibold">
                    <span>Description</span>
                    <textarea name="description" defaultValue={venue.description ?? ""} className="min-h-36 w-full rounded-md border border-input bg-background/80 px-3 py-2 text-sm" />
                  </label>
                </div>
              </section>

              <div>
                <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Save metadata</button>
                <StatusMessage updated={updated} section="metadata" />
              </div>
            </form>
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Traveler Tags</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              These describe the experience travelers can expect and appear on public venue cards.
            </p>
            <div className="mt-5">
              <p className="text-sm font-semibold">Currently assigned</p>
              {venueTags.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {venueTags.map((tag) => <Badge key={tag.id}>{tag.name}</Badge>)}
                </div>
              ) : (
                <p className="mt-3 rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                  No traveler tags are assigned yet.
                </p>
              )}
            </div>
            <form action={updateVenueTravelerTags.bind(null, venue.id)} className="mt-6 space-y-5">
              <input type="hidden" name="feedbackPath" value={feedbackPath} />
              <input type="hidden" name="publicPath" value={`/venues/${venue.slug}`} />
              <fieldset>
                <legend className="text-sm font-semibold">Managed traveler tags</legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {travelerTagOptions.map((tag) => (
                    <label key={tag.slug} className="flex items-center gap-3 rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name="tagSlugs"
                        value={tag.slug}
                        defaultChecked={assignedTagSlugs.has(tag.slug)}
                        className="h-4 w-4 rounded border-input text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {unmanagedTags.length ? (
                <p className="rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
                  Existing legacy tags are preserved separately: {unmanagedTags.map((tag) => tag.name).join(", ")}.
                </p>
              ) : null}
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Save traveler tags</button>
              <StatusMessage updated={updated} section="traveler-tags" />
            </form>
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Verification</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This describes trust level.</p>
            <p className="mt-2 text-sm text-muted-foreground">Current: {label(venue.verification_status)} · {venue.verification_score}/100</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {verificationOptions.map((option) => (
                <form key={option.value} action={updateVenueVerification.bind(null, venue.id, option.value, feedbackPath)}>
                  <button className="w-full rounded-md border border-border bg-background/70 px-3 py-3 text-left text-sm font-semibold hover:bg-muted" type="submit">
                    {option.label}
                    <span className="block text-xs font-normal text-muted-foreground">Sets score to {option.score}</span>
                  </button>
                </form>
              ))}
            </div>
            <StatusMessage updated={updated} section="verification" />
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Identity Classification</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This describes the venue&apos;s LGBTQ+ relationship or cultural role.</p>
            <p className="mt-2 text-sm text-muted-foreground">Current: {label(venue.identity_classification)}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {identityOptions.map((option) => (
                <form key={option.value} action={updateVenueIdentityClassification.bind(null, venue.id, option.value, feedbackPath)}>
                  <button className="w-full rounded-md border border-border bg-background/70 px-3 py-3 text-left text-sm font-semibold hover:bg-muted" type="submit">{option.label}</button>
                </form>
              ))}
            </div>
            <StatusMessage updated={updated} section="identity" />
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Featured / Publishing Controls</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">This controls public visibility and featured status.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Current: {venue.featured ? `Featured ${venue.featured_at ?? ""}` : "Not featured"} · Readiness: {label(venue.readiness_status)}
            </p>
            {!isFeaturedReady ? (
              <p className="mt-4 rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                To become featured-ready, improve completeness, add a photo, and set Owner Verified or Admin Verified.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <form action={updateVenueFeatured.bind(null, venue.id, true, feedbackPath)}>
                <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Feature venue</button>
              </form>
              <form action={updateVenueFeatured.bind(null, venue.id, false, feedbackPath)}>
                <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">Unfeature venue</button>
              </form>
            </div>
            <StatusMessage updated={updated} section="featured" />
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Quality & Missing Data</h2>
            <p className="mt-4 text-4xl font-semibold">{venue.completeness_score}/100</p>
            <p className="mt-2 text-sm text-muted-foreground">{label(venue.readiness_status)}</p>
            {venue.missing_data.length ? (
              <div className="mt-5">
                <p className="text-sm font-semibold">Missing or weak data</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {venue.missing_data.map((item) => <Badge key={item}>{label(item)}</Badge>)}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">Add missing fields, coordinates, hours, photos, identity, and verification to improve the score.</p>
                {venue.missing_data.includes("coordinates") ? (
                  <a href="#location" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Add latitude and longitude in Location</a>
                ) : null}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">No tracked quality gaps.</p>
            )}
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Review Status</h2>
            <p className="mt-2 text-sm text-muted-foreground">Current: {label(venue.review_status)}</p>
            <div className="mt-4 space-y-2 rounded-md border border-border bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
              <p><span className="font-semibold text-foreground">Review status</span> controls moderation workflow.</p>
              <p><span className="font-semibold text-foreground">Public visibility</span> is active only when review status is Active.</p>
              <p><span className="font-semibold text-foreground">Verification</span> describes trust level, while readiness describes data completeness.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {reviewStatusOptions.map((status) => (
                <form key={status} action={updateVenueStatus.bind(null, venue.id, status, feedbackPath)}>
                  <button className="rounded-md border border-border bg-background/70 px-3 py-2 text-sm font-semibold hover:bg-muted" type="submit">{label(status)}</button>
                </form>
              ))}
            </div>
            <StatusMessage updated={updated} section="review-status" />
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Source, Submission & Claim</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="font-semibold">Source</dt><dd className="text-muted-foreground">{venue.source ?? "Manual"}</dd></div>
              <div><dt className="font-semibold">Source ID</dt><dd className="text-muted-foreground">{venue.source_id ?? "None"}</dd></div>
              <div><dt className="font-semibold">Submission</dt><dd className="text-muted-foreground">{label(venue.submission_status)}</dd></div>
              <div><dt className="font-semibold">Claim</dt><dd className="text-muted-foreground">{venue.claimed_by ? `Claimed ${venue.claimed_at ?? ""}` : "Unclaimed"}</dd></div>
              <div><dt className="font-semibold">Reviewed</dt><dd className="text-muted-foreground">{venue.reviewed_by ? `Reviewed ${venue.reviewed_at ?? ""}` : "Not reviewed"}</dd></div>
            </dl>
            <form action={updateVenueSource.bind(null, venue.id)} className="mt-5 space-y-3">
              <input type="hidden" name="feedbackPath" value={feedbackPath} />
              <input name="source" defaultValue={venue.source ?? ""} className={InputClass()} placeholder="Source" />
              <input name="sourceId" defaultValue={venue.source_id ?? ""} className={InputClass()} placeholder="Source ID" />
              <select name="submissionStatus" defaultValue={venue.submission_status} className={InputClass()}>
                {submissionStatusOptions.map((status) => <option key={status} value={status}>{label(status)}</option>)}
              </select>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" type="submit">Save source state</button>
              <StatusMessage updated={updated} section="source" />
            </form>
          </Card>

          <Card className="bg-card/90 p-6">
            <h2 className="font-serif text-3xl font-semibold">Ownership Claims</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Current owner link: {venue.claimed_by ? `Profile ${venue.claimed_by}` : "No approved owner"}
            </p>
            <StatusMessage updated={updated} section="claim-approved" />
            <StatusMessage updated={updated} section="claim-rejected" />
            {pendingClaims.length ? (
              <div className="mt-5 space-y-4">
                {pendingClaims.map((claim) => (
                  <div key={claim.id} className="rounded-md border border-border bg-background/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{claim.claimant_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{claim.role_title ?? "Role not provided"} · {claim.claimant_email}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{claim.notes ?? "No notes provided."}</p>
                        {claim.evidence_url ? <a className="mt-2 inline-block text-sm font-semibold text-primary hover:underline" href={claim.evidence_url} target="_blank" rel="noreferrer">Open proof URL</a> : null}
                      </div>
                      <Badge>Pending</Badge>
                    </div>
                    <div className="mt-4 grid gap-3">
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">No pending ownership claims for this venue.</p>
            )}
            {claims.filter((claim) => claim.status !== "pending").length ? (
              <div className="mt-5">
                <p className="text-sm font-semibold">Reviewed claims</p>
                <div className="mt-3 space-y-2">
                  {claims.filter((claim) => claim.status !== "pending").map((claim) => (
                    <p key={claim.id} className="text-xs text-muted-foreground">{label(claim.status)} · {claim.claimant_name} · {claim.reviewed_at ? new Date(claim.reviewed_at).toLocaleString() : "Not dated"}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </aside>
      </div>
    </div>
  );
}
