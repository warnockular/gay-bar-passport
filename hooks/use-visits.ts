"use client";

import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { listMyVisits } from "@/services/client-visits";

// First authenticated TanStack Query hook. It is disabled until Supabase env vars exist.
export function useVisits() {
  return useQuery({
    enabled: isSupabaseConfigured,
    queryKey: ["visits", "mine"],
    queryFn: () => listMyVisits(createSupabaseBrowserClient())
  });
}
