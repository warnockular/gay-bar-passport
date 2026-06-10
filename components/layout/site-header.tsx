import Link from "next/link";
import { Compass, Menu, UserRound } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { AppRoute } from "@/types/navigation";

const routes: AppRoute[] = [
  { href: "/venues", label: "Venues" },
  { href: "/passport", label: "Passport" },
  { href: "/journal", label: "Journal" },
  { href: "/dashboard", label: "Dashboard" }
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-charcoal text-cream">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-normal">Gay Bar Passport</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {routes.map((route) => (
            <Link key={route.href} href={route.href} className="transition hover:text-foreground">
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
        <Button className="md:hidden" variant="outline" size="icon" aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
