import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["langsmith"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
