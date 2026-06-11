import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/admin",
  "/analytics",
  "/dashboard",
  "/favorites",
  "/feed",
  "/journal",
  "/notifications",
  "/passport",
  "/profile",
  "/users",
  "/visits",
  "/auth/update-password"
];

function shouldProtectPath(pathname: string) {
  return protectedRoutes.some((route) => pathname.startsWith(route)) || (pathname.startsWith("/venues/") && pathname.endsWith("/log-visit"));
}

// Middleware keeps protected route behavior close to the request boundary.
// It quietly skips auth checks until Supabase env vars are configured.
export async function middleware(request: NextRequest) {
  const shouldProtect = shouldProtectPath(request.nextUrl.pathname);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!shouldProtect || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/sign-in";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/analytics/:path*",
    "/dashboard/:path*",
    "/favorites/:path*",
    "/feed/:path*",
    "/journal/:path*",
    "/notifications/:path*",
    "/passport/:path*",
    "/profile/:path*",
    "/users/:path*",
    "/venues/:path*",
    "/visits/:path*",
    "/auth/update-password"
  ]
};
