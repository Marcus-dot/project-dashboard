import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Keep TypeScript strict
    ignoreBuildErrors: false,
  },
};

export default nextConfig;