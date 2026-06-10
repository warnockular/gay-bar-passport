import Link from "next/link";
import { PasswordResetForm } from "@/features/auth/password-reset-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <section className="container grid min-h-[calc(100vh-8rem)] place-items-center py-16">
      <Card className="w-full max-w-md bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Reset your passport key</CardTitle>
          <CardDescription>
            Send a secure reset link to the email connected to your Gay Bar Passport account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered it?{" "}
            <Link href="/auth/sign-in" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
