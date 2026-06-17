export const travelerTagOptions = [
  { name: "Dancing", slug: "dancing" },
  { name: "Late night", slug: "late-night" },
  { name: "Cocktails", slug: "cocktails" },
  { name: "Quiet conversation", slug: "quiet-conversation" },
  { name: "LGBTQ+ owned", slug: "lgbtq-owned" },
  { name: "Drag", slug: "drag" },
  { name: "Leather", slug: "leather" },
  { name: "Bear", slug: "bear" },
  { name: "Outdoor space", slug: "outdoor-space" },
  { name: "Food", slug: "food" },
  { name: "Live music", slug: "live-music" },
  { name: "Men-only", slug: "men-only" },
  { name: "Karaoke", slug: "karaoke" },
  { name: "Dance Floor", slug: "dance-floor" },
  { name: "Patio", slug: "patio" },
  { name: "Happy Hour", slug: "happy-hour" },
  { name: "Tourist Friendly", slug: "tourist-friendly" },
  { name: "Accessible Entrance", slug: "accessible-entrance" },
  { name: "Community", slug: "community" }
] as const;

export type TravelerTagSlug = (typeof travelerTagOptions)[number]["slug"];

export const travelerTagSlugs = travelerTagOptions.map((tag) => tag.slug);
