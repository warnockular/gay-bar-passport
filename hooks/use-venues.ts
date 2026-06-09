"use client";

import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { fallbackVenues, listPublishedVenues } from "@/services/venues";

// First public TanStack Query hook. It can read Supabase data or fall back to static seed-like data.
export function useVenues() {
  return useQuery({
    enabled: isSupabaseConfigured,
    initialData: isSupabaseConfigured ? undefined : fallbackVenues,
    queryKey: ["venues", "published"],
    queryFn: () => listPublishedVenues(createSupabaseBrowserClient())
  });
}
