import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// The admin tests save into a throwaway copy of the products (made once in tests/e2e/global-setup.ts).
const ADMIN_ROOT = path.join(os.tmpdir(), "kinetic-e2e-admin");

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  // Uses the installed Google Chrome, so no separate browser download is needed.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Scripted chat replies: tests never call a real AI provider.
      AI_PROVIDER: "mock",
      // Test-only admin account (password: e2e-test-password) saving to the throwaway copy.
      ADMIN_USERS:
        "tester:scrypt$32768$1dR6wAQ7Z0q3Mav325MdGA==$3z1bbYixO+kgZipT7dlzhgJ6csWeXzf5jt1Gl7neFU4=",
      ADMIN_SESSION_SECRET: "e2e-session-secret-that-is-long-enough-123",
      ADMIN_STORAGE: "local",
      ADMIN_LOCAL_ROOT: ADMIN_ROOT,
    },
  },
});
