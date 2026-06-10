import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ConfigurationCallout() {
  return (
    <Card className="border-terracotta/40 bg-card/85">
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-3">
          <KeyRound className="mt-1 h-5 w-5 shrink-0 text-terracotta" aria-hidden="true" />
          <div>
            <p className="font-semibold">Supabase credentials are not configured yet.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Protected pages are visible in setup mode. Add `.env.local` values to enable real auth sessions.
            </p>
          </div>
        </div>
        <Link href="/auth/sign-in" className="text-sm font-semibold text-primary hover:underline">
          Test auth form
        </Link>
      </CardContent>
    </Card>
  );
}
