import Link from "next/link";
import { Compass, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AppRoute } from "@/types/navigation";

const routes: AppRoute[] = [
  { href: "/venues", label: "Venues" },
  { href: "/passport", label: "Passport" },
  { href: "/journal", label: "Journal" },
  { href: "/analytics", label: "Analytics" },
  { href: "/dashboard", label: "Dashboard" }
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 md:flex-nowrap md:py-0">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-charcoal text-cream">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate font-serif text-xl font-semibold tracking-normal sm:text-2xl">Gay Bar Passport</span>
        </Link>
        <nav aria-label="Primary" className="order-last -mx-1 flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm font-medium text-muted-foreground md:order-none md:mx-0 md:w-auto md:gap-7 md:overflow-visible md:pb-0">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="shrink-0 rounded-md px-1 py-2 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {route.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/profile" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/sign-in" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Sign in
            </Link>
            <Link href="/auth/sign-up" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              Start journal
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
