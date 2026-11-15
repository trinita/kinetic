import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      // "server-only" throws outside Next's server build; it's a no-op in tests.
      "server-only": fileURLToPath(new URL("tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: { include: ["tests/unit/**/*.test.ts"] },
});
