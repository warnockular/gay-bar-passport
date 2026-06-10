"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailSchema, type EmailValues } from "@/schemas/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthActionResult = {
  ok: boolean;
  message: string;
};

export function PasswordResetForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  });

  function onSubmit(values: EmailValues) {
    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setResult({ ok: false, message: "Supabase is not configured yet. Add your environment variables to enable password reset." });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`
      });

      setResult(
        error
          ? { ok: false, message: error.message }
          : { ok: true, message: "Password reset link sent. Check your email for the secure reset link." }
      );
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input id="reset-email" type="email" placeholder="traveler@example.com" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p> : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
