// Login checks used by every admin page, action and route.

import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

export async function getSession(): Promise<Session | null> {
  await connection(); // always per request: never prerendered (the expiry check reads the clock)
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For pages: send visitors who aren't logged in to the login page. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For actions and routes: refuse outright (never trust that the form was only shown to logged-in users). */
export async function assertSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Not logged in");
  return session;
}
