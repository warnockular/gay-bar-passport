// Services live here so data-fetching details stay separate from UI components.
// These placeholder URLs can later be replaced with a signed image service or CMS.
export type UnsplashImage = {
  src: string;
  alt: string;
  credit: string;
};

const base = "https://images.unsplash.com";

export const unsplashImages = {
  hero: {
    src: `${base}/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2200&q=85`,
    alt: "Golden light over a boutique city street",
    credit: "Unsplash"
  },
  lisbon: {
    src: `${base}/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=85`,
    alt: "Terracotta rooftops in Lisbon",
    credit: "Unsplash"
  },
  mexicoCity: {
    src: `${base}/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=85`,
    alt: "Historic architecture and warm light in Mexico City",
    credit: "Unsplash"
  },
  copenhagen: {
    src: `${base}/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=1200&q=85`,
    alt: "Colorful canal houses in Copenhagen",
    credit: "Unsplash"
  },
  interior: {
    src: `${base}/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85`,
    alt: "Elegant bar interior with warm lighting",
    credit: "Unsplash"
  }
} satisfies Record<string, UnsplashImage>;
