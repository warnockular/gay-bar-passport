"use client";

import { useQuery } from "@tanstack/react-query";
import { fallbackVenues } from "@/services/venues";

// Client-side venue previews can use this lightweight fallback hook; Phase 4 pages fetch directory data on the server.
export function useVenues() {
  return useQuery({
    initialData: fallbackVenues,
    queryKey: ["venues", "published"],
    queryFn: async () => fallbackVenues
  });
}
