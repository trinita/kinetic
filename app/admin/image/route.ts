import type { NextRequest } from "next/server";
import { getSession } from "@/lib/admin/auth";
import { getStorage } from "@/lib/admin/storage";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// GET /admin/image?path=public/images/products/... — photo previews in the admin, read from GitHub
// (newly saved photos aren't on the live site until it rebuilds). Logged-in users only.
export async function GET(request: NextRequest) {
  if (!(await getSession())) return new Response("Not logged in", { status: 401 });
  const path = request.nextUrl.searchParams.get("path") ?? "";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (!/^public\/images\/[a-z0-9/_.-]+$/i.test(path) || path.includes("..") || !TYPES[ext]) {
    return new Response("Bad path", { status: 400 });
  }
  const file = await getStorage()?.read(path);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.data), {
    headers: { "content-type": TYPES[ext], "cache-control": "private, max-age=300" },
  });
}
