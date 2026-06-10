"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFormSchema, type AuthFormValues } from "@/schemas/auth";
import { signInWithPassword, signUpWithPassword, type AuthActionResult } from "@/features/auth/actions";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
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
      const actionResult =
        mode === "sign-in" ? await signInWithPassword(values, next) : await signUpWithPassword(values);
      setResult(actionResult);
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
