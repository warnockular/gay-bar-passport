import type { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { unsplashImages } from "@/services/unsplash";
import type { Venue } from "@/types/app";

type SupabaseAppClient = ReturnType<typeof createSupabaseBrowserClient>;

export const fallbackVenues: Venue[] = [
  {
    id: "phase-2-velvet-atlas",
    name: "Velvet Atlas",
    slug: "velvet-atlas-lisbon",
    city: "Lisbon",
    region: "Lisboa",
    country: "Portugal",
    category: "lounge",
    description: "A warm, design-forward lounge for late aperitifs and quiet city notes.",
    image_url: unsplashImages.lisbon.src,
    website_url: null,
    is_lgbtq_owned: true,
    is_published: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  },
  {
    id: "phase-2-sage-room",
    name: "Sage Room",
    slug: "sage-room-mexico-city",
    city: "Mexico City",
    region: "CDMX",
    country: "Mexico",
    category: "bar",
    description: "A leafy neighborhood bar with elegant cocktails and an intimate queer crowd.",
    image_url: unsplashImages.mexicoCity.src,
    website_url: null,
    is_lgbtq_owned: false,
    is_published: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  },
  {
    id: "phase-2-terracotta-bar",
    name: "The Terracotta Bar",
    slug: "the-terracotta-bar-copenhagen",
    city: "Copenhagen",
    region: "Capital Region",
    country: "Denmark",
    category: "bar",
    description: "A polished canal-side room with soft lighting, sharp service, and room to linger.",
    image_url: unsplashImages.copenhagen.src,
    website_url: null,
    is_lgbtq_owned: true,
    is_published: true,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  }
];

// Services hide Supabase query details from components and hooks.
export async function listPublishedVenues(supabase?: SupabaseAppClient): Promise<Venue[]> {
  if (!supabase) {
    return fallbackVenues;
  }

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("is_published", true)
    .order("city", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}
