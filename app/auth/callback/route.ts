import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Supabase Auth redirects email confirmations, magic links, and resets here before sending users onward.
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const destination = next && next.startsWith("/") ? next : "/dashboard";

  if (!isSupabaseConfigured || !code) {
    return NextResponse.redirect(new URL("/auth/sign-in", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
