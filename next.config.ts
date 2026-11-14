import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The landing page is a static page built with the design-taste-frontend kit (public/landing, public/assets).
  async rewrites() {
    return { beforeFiles: [{ source: "/", destination: "/landing/index.html" }], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
