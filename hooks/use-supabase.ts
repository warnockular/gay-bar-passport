"use client";

import { useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Client components can use this hook once auth flows are introduced.
export function useSupabase() {
  return useMemo(() => createSupabaseBrowserClient(), []);
}
