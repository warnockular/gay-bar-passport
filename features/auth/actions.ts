"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authFormSchema,
  emailSchema,
  passwordUpdateSchema,
  type AuthFormValues,
  type EmailValues,
  type PasswordUpdateValues
} from "@/schemas/auth";
import { env, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  ok: boolean;
  message: string;
};

function getAuthRedirectPath(next?: string) {
  return next && next.startsWith("/") ? next : "/dashboard";
}

function getSiteUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

export async function signInWithPassword(values: AuthFormValues, next?: string): Promise<AuthActionResult> {
  const parsed = authFormSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your email and password." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to enable sign in." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect(getAuthRedirectPath(next));
}

export async function signUpWithPassword(values: AuthFormValues): Promise<AuthActionResult> {
  const parsed = authFormSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your email and password." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to enable account creation." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: getSiteUrl("/auth/callback?next=/profile")
    }
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Account created. Check your email if confirmations are enabled, then sign in."
  };
}

export async function signInWithMagicLink(values: EmailValues, next?: string): Promise<AuthActionResult> {
  const parsed = emailSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to enable magic links." };
  }

  const redirectPath = `/auth/callback?next=${encodeURIComponent(getAuthRedirectPath(next))}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: getSiteUrl(redirectPath)
    }
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Magic link sent. Check your email to continue your passport session." };
}

export async function requestPasswordReset(values: EmailValues): Promise<AuthActionResult> {
  const parsed = emailSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to enable password reset." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: getSiteUrl("/auth/callback?next=/auth/update-password")
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Password reset link sent. Check your email for the secure reset link." };
}

export async function updatePassword(values: PasswordUpdateValues): Promise<AuthActionResult> {
  const parsed = passwordUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Use at least 8 characters." };
  }

  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured yet. Add your environment variables to update passwords." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/profile?updated=password");
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
