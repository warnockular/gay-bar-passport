"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  async function handleSignOut() {
    if (isSupabaseConfigured) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    window.location.assign("/");
  }

  return (
    <Button type="button" variant="outline" onClick={handleSignOut}>
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Sign out
    </Button>
  );
}
