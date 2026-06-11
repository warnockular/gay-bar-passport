import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/state/empty-state";
import { buttonVariants } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <section className="container py-14 md:py-20">
      <EmptyState
        action={<Link className={buttonVariants()} href="/dashboard">Return to dashboard</Link>}
        description="The route may have moved, or the record may no longer be available."
        icon={<Compass className="h-6 w-6" aria-hidden="true" />}
        title="This page is not in the passport."
      />
    </section>
  );
}
