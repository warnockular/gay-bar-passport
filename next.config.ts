import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb"
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "fzaqoejmsfwgnppuasqj.supabase.co"
      }
    ]
  },
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/auth/sign-in",
        permanent: false
      },
      {
        source: "/auth/signup",
        destination: "/auth/sign-up",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
