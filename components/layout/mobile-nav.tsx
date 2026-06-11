"use client";

import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { AppRoute } from "@/types/navigation";

type MobileNavProps = {
  isSignedIn: boolean;
  routes: AppRoute[];
};

export function MobileNav({ isSignedIn, routes }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    window.location.assign("/");
  }

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </Button>
      {isOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile"
          className="fixed inset-x-0 top-16 z-[100] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background px-5 py-4 shadow-editorial"
        >
          <div className="grid gap-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-md px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setIsOpen(false)}
              >
                {route.label}
              </Link>
            ))}
            {isSignedIn ? (
              <Button type="button" variant="outline" className="mt-2 w-full justify-start" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
