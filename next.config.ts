import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    // Admin saves send compressed photos (the browser shrinks them first); Vercel caps requests at 4.5 MB.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Search reads content and vectors from disk at request time; make sure they ship with the server.
  outputFileTracingIncludes: {
    "/api/search": ["./content/**/*", "./data/**/*"],
    "/api/chat": ["./content/**/*", "./data/**/*"],
    "/*/search": ["./content/**/*", "./data/**/*"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
