import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

// Server Supabase client. Future server actions and route handlers should start here.
export async function createSupabaseServerClient() {
    if (!isSupabaseConfigured || !env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Missing Supabase server environment variables.");
    }

  const cookieStore = await cookies();

  return createServerClient<Database, "public", Database["public"]>(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
            cookies: {
                      getAll() {
                                  return cookieStore.getAll();
                      },
                      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                                  try {
                                                cookiesToSet.forEach(({ name, value, options }) => {
                                                                cookieStore.set(name, value, options);
                                                });
                                  } catch {
                                                // Server Components cannot write cookies; middleware and actions handle refresh persistence.
                                  }
                      }
            }
    }
      );
}
