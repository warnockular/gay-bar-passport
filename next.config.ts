import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
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
