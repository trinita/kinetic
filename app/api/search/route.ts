import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale } from "@/lib/i18n/routing";
import { MAX_QUERY_LENGTH, search } from "@/lib/search";

// GET /api/search?q=meja&lang=id
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").slice(0, MAX_QUERY_LENGTH);
  const langParam = params.get("lang") ?? defaultLocale;
  const locale = hasLocale(langParam) ? langParam : defaultLocale;

  const results = await search(locale, q);
  return NextResponse.json({ q, results }, { headers: { "cache-control": "public, max-age=60" } });
}
