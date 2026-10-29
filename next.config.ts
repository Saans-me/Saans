import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A stray package-lock.json in the home folder otherwise makes Turbopack guess the wrong root.
  turbopack: { root: __dirname },
};

export default nextConfig;
