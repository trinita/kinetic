import { NextResponse, type NextRequest } from "next/server";
import { resolveRequest } from "@/lib/i18n/routing";

export function proxy(request: NextRequest) {
  const decision = resolveRequest(request.nextUrl.pathname);
  if (decision.type === "next") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = decision.pathname;
  return decision.type === "rewrite" ? NextResponse.rewrite(url) : NextResponse.redirect(url, 308);
}

export const config = {
  // Pages only: skip Next internals, API routes, the admin (/keystatic) and any file with an extension.
  matcher: ["/((?!_next|api|keystatic|.*\\..*).*)"],
};
