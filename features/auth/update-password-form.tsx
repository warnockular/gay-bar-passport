"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { passwordUpdateSchema, type PasswordUpdateValues } from "@/schemas/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthActionResult = {
  ok: boolean;
  message: string;
};

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AuthActionResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordUpdateValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { password: "" }
  });

  function onSubmit(values: PasswordUpdateValues) {
    startTransition(async () => {
      if (!isSupabaseConfigured) {
        setResult({ ok: false, message: "Supabase is not configured yet. Add your environment variables to update passwords." });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password
      });

      if (error) {
        setResult({ ok: false, message: error.message });
        return;
      }

      router.refresh();
      router.push("/profile?updated=password");
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" type="password" placeholder="Eight characters minimum" {...register("password")} />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      {result ? <p className={result.ok ? "text-sm text-sage" : "text-sm text-destructive"}>{result.message}</p> : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update password"}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </form>
  );
}
