import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <section className="container grid min-h-[calc(100vh-8rem)] place-items-center py-16">
      <Card className="w-full max-w-md bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Open a passport</CardTitle>
          <CardDescription>
            Create a Supabase Auth account and prepare your protected travel journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign-up form...</p>}>
            <AuthForm mode="sign-up" />
          </Suspense>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already started?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
