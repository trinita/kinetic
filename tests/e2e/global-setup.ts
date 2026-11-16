import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Fresh throwaway copy of the products for the admin tests (never the real content/).
export default function globalSetup() {
  const root = path.join(os.tmpdir(), "kinetic-e2e-admin");
  fs.rmSync(root, { recursive: true, force: true });
  for (const dir of ["content/products", "public/images/products"]) {
    fs.cpSync(dir, path.join(root, dir), { recursive: true });
  }
}
