"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFormSchema, type AuthFormValues } from "@/schemas/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

type AuthActionResult = {
  ok: boolean;
  message: string;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  function onSubmit(values: AuthFormValues) {
    startTransition(async () => {
      const next = searchParams.get("next") ?? undefined;
      const destination = next && next.startsWith("/") ? next : "/dashboard";

      if (!isSupabaseConfigured) {
        setResult({
          ok: false,
          message: "Supabase is not configured yet. Add your environment variables to enable auth."
        });
        return;
      }

      const supabase = createSupabaseBrowserClient();

      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword(values);

        if (error) {
          setResult({ ok: false, message: error.message });
          return;
        }

        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          setResult({ ok: false, message: "Your session could not be confirmed. Please try signing in again." });
          return;
        }

        router.refresh();
        window.location.assign(destination);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/profile`
        }
      });

      if (error) {
        setResult({ ok: false, message: error.message });
        return;
      }

      setResult({
        ok: true,
        message: "Account created. Check your email if confirmations are enabled, then sign in."
      });
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="traveler@example.com" {...register("email")} />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" placeholder="Eight characters minimum" {...register("password")} />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      {result ? (
        <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
