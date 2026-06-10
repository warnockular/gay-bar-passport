import Image from "next/image";
import Link from "next/link";
import { BarChart3, BookOpen, Compass, Map, Plane, Sparkles } from "lucide-react";
import { DestinationCard } from "@/components/landing/destination-card";
import { PassportStamp } from "@/components/landing/passport-stamp";
import { PreviewPanel } from "@/components/landing/preview-panel";
import { SectionHeading } from "@/components/landing/section-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { unsplashImages } from "@/services/unsplash";

const destinations = [
  {
    city: "Lisbon",
    region: "Portugal",
    image: unsplashImages.lisbon,
    note: "Terracotta rooftops, intimate cocktail rooms, and late-night neighborhoods built for wandering."
  },
  {
    city: "Mexico City",
    region: "Mexico",
    image: unsplashImages.mexicoCity,
    note: "A layered city of design hotels, queer dance floors, leafy plazas, and long-form dinner plans."
  },
  {
    city: "Copenhagen",
    region: "Denmark",
    image: unsplashImages.copenhagen,
    note: "Canal light, polished interiors, and warm social rooms tucked inside a crisp northern rhythm."
  }
];

export default function HomePage() {
  return (
    <div>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <Image src={unsplashImages.hero.src} alt={unsplashImages.hero.alt} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/85 via-charcoal/45 to-charcoal/5" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        <div className="container relative flex min-h-[calc(100vh-4rem)] items-center py-20">
          <div className="max-w-3xl text-cream">
            <Badge className="border-cream/30 bg-cream/10 text-cream">Phase 1 Preview</Badge>
            <h1 className="mt-6 font-serif text-6xl font-semibold leading-[0.95] md:text-8xl">Gay Bar Passport</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-cream/82 md:text-xl">
              A luxury queer travel journal for discovering memorable venues, collecting passport stamps, and turning
              nights out into a beautifully kept travel archive.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/sign-up" className={cn(buttonVariants({ size: "lg" }))}>
                Start the preview
              </Link>
              <Link
                href="/venues"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "border-cream/40 bg-cream/10 text-cream hover:bg-cream/20"
                )}
              >
                Explore venues
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Editorial travel journal"
            title="Built like a passport book, edited like a magazine."
            copy="Gay Bar Passport starts with a calm architecture and a premium visual language: tactile paper tones, destination photography, quiet art deco geometry, and room for richer travel data later."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {["Discover", "Stamp", "Remember"].map((item, index) => (
              <div key={item} className="rounded-lg border border-border bg-card/70 p-5">
                <p className="font-serif text-4xl text-terracotta">0{index + 1}</p>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-charcoal py-20 text-cream">
        <div className="container">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <Badge className="border-cream/25 bg-cream/10 text-cream">Featured destinations</Badge>
              <h2 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">City cards for future venue guides.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-cream/70">
              Placeholder imagery and static copy for now, ready for Supabase-backed destinations in the next phase.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {destinations.map((destination) => (
              <DestinationCard key={destination.city} {...destination} />
            ))}
          </div>
        </div>
      </section>

      <section className="container grid gap-10 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Passport preview"
            title="A stamp system with a little ceremony."
            copy="Stamps are decorative today, but the component structure leaves room for future visit history, city progress, venue categories, and earned milestones."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <PassportStamp city="LIS" date="FIRST VISIT" tone="sage" />
            <PassportStamp city="CDMX" date="NIGHT OUT" tone="terracotta" />
            <PassportStamp city="CPH" date="JOURNAL" tone="rose" />
          </div>
        </div>
        <Card className="overflow-hidden bg-card/85">
          <Image
            src={unsplashImages.interior.src}
            alt={unsplashImages.interior.alt}
            width={900}
            height={1100}
            className="aspect-[4/5] w-full object-cover"
          />
        </Card>
      </section>

      <section className="container py-20">
        <SectionHeading
          eyebrow="Future product surface"
          title="The Phase 1 foundation is already split by product areas."
          copy="Venue discovery, travel journaling, passport collecting, and analytics each have a route and feature folder so the project can grow without becoming tangled."
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <PreviewPanel
            icon={Compass}
            title="Venue Discovery"
            copy="A polished shell for future LGBTQ+ venue browsing, filtering, and city-specific recommendations."
            detail="Prepared for Supabase-backed venue records."
          />
          <PreviewPanel
            icon={BookOpen}
            title="Journal"
            copy="A calm writing space for future visit notes, trip memories, and personal travel reflections."
            detail="Ready for React Hook Form and Zod expansion."
          />
          <PreviewPanel
            icon={BarChart3}
            title="Analytics"
            copy="A dashboard placeholder for future city stats, stamp progress, category patterns, and travel history."
            detail="TanStack Query is already available."
          />
        </div>
      </section>

      <section className="container pb-20">
        <div className="rounded-lg bg-sage p-8 text-cream md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-cream/75">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Passport issue desk
              </div>
              <h2 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">Ready for Phase 2 data modeling.</h2>
              <p className="mt-4 max-w-2xl text-cream/75">
                The experience is static by design for this phase, with the app architecture prepared for auth,
                migrations, generated types, and real venue data.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/auth/sign-up" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                <Plane className="h-4 w-4" aria-hidden="true" />
                Preview sign up
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "border-cream/40 bg-transparent text-cream hover:bg-cream/10"
                )}
              >
                <Map className="h-4 w-4" aria-hidden="true" />
                View dashboard
              </Link>
            </div>
          </div>
          <Separator className="my-8 bg-cream/20" />
          <p className="text-sm text-cream/65">No authentication, CRUD, database migrations, or analytics are implemented in Phase 1.</p>
        </div>
      </section>
    </div>
  );
}
