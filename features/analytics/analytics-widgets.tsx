import Link from "next/link";
import { BarChart3, Globe2, MapPinned, Plane, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnalyticsBucket, TravelAnalytics } from "@/services/analytics";

function maxCount(items: AnalyticsBucket[]) {
  return Math.max(1, ...items.map((item) => item.count));
}

export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="bg-card/90 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 font-serif text-4xl font-semibold">{value}</p>
    </Card>
  );
}

export function BarList({ empty, items }: { empty: string; items: AnalyticsBucket[] }) {
  const max = maxCount(items);
  if (!items.length) return <p className="text-sm leading-6 text-muted-foreground">{empty}</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.slug ?? ""}`}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold">{item.label}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(12, (item.count / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityChart({ journals, visits }: { journals: AnalyticsBucket[]; visits: AnalyticsBucket[] }) {
  const labels = Array.from(new Set([...visits, ...journals].map((item) => item.label))).slice(-8);
  const max = maxCount([...visits, ...journals]);
  if (!labels.length) return <p className="text-sm leading-6 text-muted-foreground">Log visits and write journal entries to see travel cadence over time.</p>;

  return (
    <div className="grid min-h-64 grid-cols-2 items-end gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {labels.map((label) => {
        const visitCount = visits.find((item) => item.label === label)?.count ?? 0;
        const journalCount = journals.find((item) => item.label === label)?.count ?? 0;
        return (
          <div key={label} className="flex h-56 flex-col justify-end gap-2">
            <div className="flex items-end gap-1">
              <div className="w-full rounded-t-md bg-sage" style={{ height: `${Math.max(8, (visitCount / max) * 180)}px` }} title={`${visitCount} visits`} />
              <div className="w-full rounded-t-md bg-terracotta" style={{ height: `${Math.max(8, (journalCount / max) * 180)}px` }} title={`${journalCount} journal entries`} />
            </div>
            <p className="text-center text-xs text-muted-foreground">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

export function DestinationHeatMap({ items }: { items: AnalyticsBucket[] }) {
  const max = maxCount(items);
  if (!items.length) return <p className="text-sm leading-6 text-muted-foreground">Your country and city intensity map appears after you log visits.</p>;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link key={item.slug ?? item.label} href={item.slug ? `/analytics/countries#${item.slug}` : "/analytics/countries"} className="rounded-md border border-border bg-background/70 p-4 transition-colors hover:bg-muted">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold">{item.label}</span>
            <Badge>{item.count}</Badge>
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted">
            <div className="h-3 rounded-full bg-burnt" style={{ width: `${Math.max(16, (item.count / max) * 100)}%` }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export function TravelMap({ analytics }: { analytics: TravelAnalytics }) {
  const plotted = analytics.visits.filter((visit) => visit.venue?.latitude && visit.venue.longitude);
  if (!plotted.length) {
    return (
      <Card className="bg-card/90 p-6">
        <Globe2 className="h-6 w-6 text-sage" aria-hidden="true" />
        <p className="mt-4 font-semibold">Map points are waiting for coordinates.</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Log visits at venues with latitude and longitude to place them on the travel map.</p>
      </Card>
    );
  }

  const regionSummary = [
    { label: "Americas", count: plotted.filter((visit) => (visit.venue?.longitude ?? 0) < -25).length, x: 225, y: 225 },
    { label: "Europe", count: plotted.filter((visit) => (visit.venue?.longitude ?? 0) >= -25 && (visit.venue?.longitude ?? 0) < 45 && (visit.venue?.latitude ?? 0) > 35).length, x: 510, y: 165 },
    { label: "Africa", count: plotted.filter((visit) => (visit.venue?.longitude ?? 0) >= -25 && (visit.venue?.longitude ?? 0) < 55 && (visit.venue?.latitude ?? 0) <= 35).length, x: 525, y: 275 },
    { label: "Asia-Pacific", count: plotted.filter((visit) => (visit.venue?.longitude ?? 0) >= 45).length, x: 745, y: 230 }
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card/90">
      <div className="border-b border-border p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Personal travel map</p>
        <h2 className="mt-2 font-serif text-3xl font-semibold">Visited venues by region, country, and city.</h2>
      </div>
      <svg viewBox="0 0 1000 520" role="img" aria-label="Map-style travel heat map of visited venues" className="h-auto w-full bg-[linear-gradient(180deg,hsl(var(--muted)/0.55),transparent)]">
        <rect width="1000" height="520" fill="transparent" />
        <path d="M85 155 C140 112 225 109 291 145 C344 175 337 231 296 267 C236 318 139 295 96 242 C70 210 57 178 85 155Z" fill="hsl(var(--sage) / 0.16)" stroke="hsl(var(--sage) / 0.45)" strokeWidth="2" />
        <path d="M424 142 C463 103 546 104 594 140 C620 160 613 196 576 212 C526 235 447 226 416 194 C397 174 401 153 424 142Z" fill="hsl(var(--terracotta) / 0.18)" stroke="hsl(var(--terracotta) / 0.45)" strokeWidth="2" />
        <path d="M447 240 C500 213 581 226 622 278 C660 326 634 402 567 415 C492 430 425 381 414 319 C408 282 421 253 447 240Z" fill="hsl(var(--rose) / 0.20)" stroke="hsl(var(--rose) / 0.45)" strokeWidth="2" />
        <path d="M645 142 C733 91 857 123 916 205 C958 264 926 341 847 360 C745 384 637 321 620 232 C612 192 622 158 645 142Z" fill="hsl(var(--burnt) / 0.14)" stroke="hsl(var(--burnt) / 0.42)" strokeWidth="2" />
        {regionSummary.map((region) => (
          <g key={region.label}>
            <circle cx={region.x} cy={region.y} r={18 + region.count * 5} fill="hsl(var(--background) / 0.82)" stroke="hsl(var(--border))" />
            <text x={region.x} y={region.y - 30} textAnchor="middle" className="fill-foreground text-[18px] font-semibold">{region.label}</text>
            <text x={region.x} y={region.y + 6} textAnchor="middle" className="fill-muted-foreground text-[18px]">{region.count}</text>
          </g>
        ))}
        {plotted.map((visit) => {
          const x = ((visit.venue!.longitude! + 180) / 360) * 1000;
          const y = ((90 - visit.venue!.latitude!) / 180) * 520;
          return (
            <g key={visit.id}>
              <circle cx={x} cy={y} r="16" fill="hsl(var(--terracotta))" opacity="0.2" />
              <circle cx={x} cy={y} r="6" fill="hsl(var(--burnt))" />
              <text x={x + 12} y={y - 10} className="fill-foreground text-[16px] font-semibold">{visit.venue?.city}</text>
            </g>
          );
        })}
      </svg>
      <div className="grid gap-3 border-t border-border p-4 text-sm text-muted-foreground md:grid-cols-2">
        {plotted.slice(0, 6).map((visit) => (
          <div key={visit.id} className="rounded-md border border-border bg-background/70 p-3">
            <p className="font-semibold text-foreground">{visit.venue?.name}</p>
            <p>{visit.venue?.city}, {visit.venue?.country}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryCards({ analytics }: { analytics: TravelAnalytics }) {
  const cards = [
    { icon: MapPinned, label: "Most visited city", value: analytics.mostVisitedCity?.label ?? "Not enough visits" },
    { icon: Globe2, label: "Most visited country", value: analytics.mostVisitedCountry?.label ?? "Not enough visits" },
    { icon: Plane, label: "Travel streak", value: `${analytics.travelStreak} day${analytics.travelStreak === 1 ? "" : "s"}` },
    { icon: Sparkles, label: "Favorite destination", value: analytics.cities[0]?.label ?? "Start exploring" }
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card/90 p-5">
          <card.icon className="h-5 w-5 text-terracotta" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{card.label}</p>
          <p className="mt-2 font-serif text-2xl font-semibold">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}

export function RecentActivity({ analytics }: { analytics: TravelAnalytics }) {
  if (!analytics.recentActivity.length) return <p className="text-sm leading-6 text-muted-foreground">Recent activity appears after you log visits or write journal entries.</p>;

  return (
    <div className="space-y-3">
      {analytics.recentActivity.map((item) => (
        <div key={`${item.type}-${item.date}-${item.label}`} className="flex items-center gap-3 rounded-md border border-border bg-background/70 p-3">
          <BarChart3 className="h-4 w-4 text-sage" aria-hidden="true" />
          <p className="text-sm">
            <span className="font-semibold">{item.label}</span>
            <span className="text-muted-foreground"> · {item.date}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
