import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { MagicLinkForm } from "@/features/auth/magic-link-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SignInPage() {
  return (
    <section className="container grid min-h-[calc(100vh-8rem)] place-items-center py-16">
      <Card className="w-full max-w-md bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Return to your passport</CardTitle>
          <CardDescription>
            Sign in with Supabase Auth once your project environment variables are configured.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-in form...</p>}>
            <AuthForm mode="sign-in" />
          </Suspense>
          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Separator />
            <span>or</span>
            <Separator />
          </div>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading magic link form...</p>}>
            <MagicLinkForm />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New traveler?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Need a new key?{" "}
            <Link href="/auth/reset-password" className="font-semibold text-primary hover:underline">
              Reset password
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
