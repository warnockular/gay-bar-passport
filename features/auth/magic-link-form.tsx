"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
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

export function MagicLinkForm() {
  const searchParams = useSearchParams();
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
        setResult({ ok: false, message: "Supabase is not configured yet. Add your environment variables to enable magic links." });
        return;
      }

      const next = searchParams.get("next") ?? "/dashboard";
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/dashboard")}`
        }
      });

      setResult(
        error
          ? { ok: false, message: error.message }
          : { ok: true, message: "Magic link sent. Check your email to continue your passport session." }
      );
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input id="magic-email" type="email" placeholder="traveler@example.com" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p> : null}
      <Button className="w-full" type="submit" variant="outline" disabled={isPending}>
        <MailCheck className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Sending..." : "Send magic link"}
      </Button>
    </form>
  );
}
