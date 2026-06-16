import Link from "next/link";
import { CheckSquare, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { listAdminVenueReviewQueue, listAdminVenues } from "@/services/admin";

const checklist = [
  { label: "Auth working", href: "/auth/sign-in" },
  { label: "Venue directory working", href: "/venues" },
  { label: "Montreal venues present", href: "/admin/venues?city=montreal" },
  { label: "Favorite flow working", href: "/venues" },
  { label: "Visit logging working", href: "/venues" },
  { label: "Visit photo upload working", href: "/passport" },
  { label: "Passport stamp created", href: "/passport" },
  { label: "Community submission working", href: "/venues/submit" },
  { label: "Admin review queue working", href: "/admin/venues/review?city=montreal" }
];

function locationLabel(venue: { city: string; country: string; region: string | null }) {
  return [venue.city, venue.region, venue.country].filter(Boolean).join(", ");
}

export default async function AdminFieldTestPage() {
  const [venues, reviewQueue] = await Promise.all([
    listAdminVenues(),
    listAdminVenueReviewQueue("all", "newest")
  ]);
  const montrealVenues = venues.filter((venue) => venue.city.toLowerCase() === "montreal" || venue.region?.toLowerCase() === "quebec");
  const montrealQueue = reviewQueue.filter((venue) => venue.city.toLowerCase() === "montreal" || venue.region?.toLowerCase() === "quebec");

  return (
    <div>
      <Badge>Montreal Field Test</Badge>
      <h1 className="mt-5 font-serif text-5xl font-semibold">Weekend readiness checklist.</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
        Use this page as a lightweight launch pad for Montreal testing. Checks are manual for now so the team can move quickly without adding fragile test automation.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card className="bg-card/90 p-5">
          <h2 className="font-serif text-3xl font-semibold">Manual test checklist</h2>
          <div className="mt-5 grid gap-3">
            {checklist.map((item) => (
              <label key={item.label} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/70 p-3 text-sm font-semibold">
                <span className="flex min-w-0 items-center gap-3">
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" />
                  <span>{item.label}</span>
                </span>
                <Link className="shrink-0 text-primary hover:underline" href={item.href}>
                  Open
                </Link>
              </label>
            ))}
          </div>
        </Card>

        <Card className="bg-card/90 p-5">
          <h2 className="font-serif text-2xl font-semibold">Quick links</h2>
          <div className="mt-4 grid gap-2 text-sm font-semibold">
            <Link className="rounded-md border border-border bg-background/70 px-3 py-2 hover:bg-muted" href="/venues?country=canada&q=Montreal">Public Montreal venue search</Link>
            <Link className="rounded-md border border-border bg-background/70 px-3 py-2 hover:bg-muted" href="/admin/venues?city=montreal">Admin Montreal venues</Link>
            <Link className="rounded-md border border-border bg-background/70 px-3 py-2 hover:bg-muted" href="/admin/venues/review?city=montreal">Montreal review queue</Link>
            <Link className="rounded-md border border-border bg-background/70 px-3 py-2 hover:bg-muted" href="/admin/audit-logs?action=venue_community_submitted">Submission audit logs</Link>
            <a className="rounded-md border border-border bg-background/70 px-3 py-2 hover:bg-muted" href="mailto:?subject=Gay%20Bar%20Passport%20Montreal%20Test%20Feedback">
              Send feedback
            </a>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="bg-card/90 p-5">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-terracotta" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold">Montreal venues</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{montrealVenues.length} venue(s) currently match Montreal or Quebec.</p>
          <div className="mt-5 space-y-3">
            {montrealVenues.length ? montrealVenues.slice(0, 8).map((venue) => (
              <Link key={venue.id} className="block rounded-md border border-border bg-background/70 p-3 hover:bg-muted" href={`/admin/venues/${venue.id}`}>
                <p className="font-semibold">{venue.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{locationLabel(venue)} · {venue.review_status}</p>
              </Link>
            )) : (
              <p className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">No Montreal venues found yet. Submit or create a small curated test set before field testing.</p>
            )}
          </div>
        </Card>

        <Card className="bg-card/90 p-5">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-sage" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold">Review queue</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{montrealQueue.length} Montreal or Quebec venue(s) are visible in the admin queue.</p>
          <div className="mt-5 space-y-3">
            {montrealQueue.length ? montrealQueue.slice(0, 8).map((venue) => (
              <Link key={venue.id} className="block rounded-md border border-border bg-background/70 p-3 hover:bg-muted" href={`/admin/venues/${venue.id}`}>
                <p className="font-semibold">{venue.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{locationLabel(venue)} · {venue.submission_status} · {venue.verification_status}</p>
              </Link>
            )) : (
              <p className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">No Montreal queue items are currently visible.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-8 bg-card/90 p-5">
        <h2 className="font-serif text-3xl font-semibold">Mobile smoke pass</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          {["/venues", "/venues/[slug]", "/passport", "/venues/submit", "/admin/venues/review", "visit logging form"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-md border border-border bg-background/70 p-3">
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" />
              <span>No horizontal overflow, readable forms, tappable buttons, safe image/photo states: {item}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Photo compression, maps, and automated QA remain future work. This page is for field-test readiness only.
        </p>
      </Card>
    </div>
  );
}
