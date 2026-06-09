"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authFormSchema, type AuthFormValues } from "@/schemas/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  ok: boolean;
  message: string;
};

function getAuthRedirectPath(next?: string) {
  return next && next.startsWith("/") ? next : "/dashboard";
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
    password: parsed.data.password
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: "Account created. Check your email if confirmations are enabled, then sign in."
  };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
