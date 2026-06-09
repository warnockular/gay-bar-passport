import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New traveler?{" "}
            <Link href="/auth/sign-up" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
