import { MapPinned } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-charcoal text-cream">
      <div className="container flex flex-col gap-4 py-8 text-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <MapPinned className="h-5 w-5 text-rose" aria-hidden="true" />
          <span className="font-serif text-lg">Gay Bar Passport</span>
        </div>
        <p className="max-w-xl text-cream/70">
          Phase 1 foundation for a future queer travel journal, venue guide, passport stamp archive, and city analytics.
        </p>
      </div>
    </footer>
  );
}
