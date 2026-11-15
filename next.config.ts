import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Search reads content and vectors from disk at request time; make sure they ship with the server.
  outputFileTracingIncludes: {
    "/api/search": ["./content/**/*", "./data/**/*"],
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
