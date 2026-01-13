import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Request body size limits for server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
