"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AppRoute } from "@/types/navigation";

type MobileNavProps = {
  routes: AppRoute[];
};

export function MobileNav({ routes }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

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
        <nav id="mobile-navigation" aria-label="Mobile" className="absolute left-0 right-0 top-full border-b border-border bg-background/98 px-5 py-4 shadow-editorial">
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
          </div>
        </nav>
      ) : null}
    </div>
  );
}
