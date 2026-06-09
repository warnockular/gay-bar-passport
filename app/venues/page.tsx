import Image from "next/image";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VenueList } from "@/features/venues/venue-list";
import { unsplashImages } from "@/services/unsplash";

export default function VenuesPage() {
  return (
    <PageShell
      eyebrow="Venues"
      title="A polished frame for future LGBTQ+ venue discovery."
      copy="Phase 2 introduces the venue data service and query hook. Full search, filtering, detail pages, and admin curation are still reserved for later phases."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="overflow-hidden bg-card/85">
          <Image src={unsplashImages.interior.src} alt={unsplashImages.interior.alt} width={1200} height={700} className="h-80 w-full object-cover" />
          <CardHeader>
            <CardTitle className="font-serif text-3xl">Discovery tools placeholder</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-background/60 p-4">
              <Search className="h-5 w-5 text-sage" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">Search shell</p>
            </div>
            <div className="rounded-md border border-border bg-background/60 p-4">
              <SlidersHorizontal className="h-5 w-5 text-terracotta" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">Filter shell</p>
            </div>
          </CardContent>
        </Card>
        <VenueList />
      </div>
    </PageShell>
  );
}
