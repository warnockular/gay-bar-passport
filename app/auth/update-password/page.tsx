import { UpdatePasswordForm } from "@/features/auth/update-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <section className="container grid min-h-[calc(100vh-8rem)] place-items-center py-16">
      <Card className="w-full max-w-md bg-card/90">
        <CardHeader>
          <CardTitle className="font-serif text-3xl">Choose a new password</CardTitle>
          <CardDescription>
            Your reset link has opened a secure session. Set the new key for your travel journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdatePasswordForm />
        </CardContent>
      </Card>
    </section>
  );
}
