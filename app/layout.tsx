import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/app/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gay-bar-passport.vercel.app"),
  title: "Gay Bar Passport",
  description: "A luxury queer travel journal for venues, memories, stamps, and city stories.",
  openGraph: {
    title: "Gay Bar Passport",
    description: "Discover queer venues, collect passport stamps, and preserve travel memories.",
    siteName: "Gay Bar Passport",
    type: "website"
  }
};

// App Router pages live inside app/. Shared providers, navigation, and page chrome begin here.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} min-h-screen font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
