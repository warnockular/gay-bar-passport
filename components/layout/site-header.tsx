import Link from "next/link";
import { Compass, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { getProfile } from "@/services/profiles";
import type { AppRoute } from "@/types/navigation";

const baseDesktopRoutes: AppRoute[] = [
  { href: "/venues", label: "Venues" },
  { href: "/passport", label: "Passport" },
  { href: "/journal", label: "Journal" },
  { href: "mailto:?subject=Gay%20Bar%20Passport%20Montreal%20Test%20Feedback", label: "Feedback" }
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id).catch(() => null) : null;
  const isAdmin = profile?.role === "admin" || profile?.role === "moderator";
  const desktopRoutes: AppRoute[] = [...baseDesktopRoutes, ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])];
  const mobileRoutes: AppRoute[] = [
    { href: "/", label: "Home" },
    { href: "/venues", label: "Venues" },
    { href: "/passport", label: "Passport" },
    { href: "/journal", label: "Journal" },
    { href: "mailto:?subject=Gay%20Bar%20Passport%20Montreal%20Test%20Feedback", label: "Feedback" },
    { href: "/profile", label: "Profile" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : [])
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container relative flex min-h-16 items-center justify-between gap-3 py-3 md:py-0">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-charcoal text-cream">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate font-serif text-xl font-semibold tracking-normal sm:text-2xl">Gay Bar Passport</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-3 text-sm font-medium text-muted-foreground lg:gap-5 md:flex">
          {desktopRoutes.map((route) => (
            <Link key={route.href} href={route.href} className="shrink-0 rounded-md px-1 py-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {route.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/profile" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Profile
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/auth/sign-in" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign in
            </Link>
            <Link href="/auth/sign-up" className={cn(buttonVariants({ size: "sm" }))}>
              Start journal
            </Link>
          </div>
        )}
        <MobileNav routes={mobileRoutes} isSignedIn={Boolean(user)} />
      </div>
    </header>
  );
}
