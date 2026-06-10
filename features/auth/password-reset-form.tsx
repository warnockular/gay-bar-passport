"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type AuthActionResult } from "@/features/auth/actions";
import { emailSchema, type EmailValues } from "@/schemas/auth";

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
      setResult(await requestPasswordReset(values));
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
