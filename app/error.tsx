"use client";

import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/state/empty-state";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="container py-14 md:py-20">
      <EmptyState
        action={<Button onClick={reset}>Try again</Button>}
        description="The app could not finish loading this view. Try again, and if it persists, check the latest deployment logs."
        icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
        title="Something went off route."
      />
    </section>
  );
}
