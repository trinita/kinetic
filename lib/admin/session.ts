// Signed login sessions in an httpOnly cookie: base64url(JSON payload) + "." + HMAC-SHA256.
// Nothing is stored on the server; changing ADMIN_SESSION_SECRET logs everyone out.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "kinetic_admin";
export const SESSION_HOURS = 8;

export type Session = { user: string; exp: number };

const secret = () => {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set (at least 32 characters)");
  return s;
};

const sign = (data: string, key: string) => createHmac("sha256", key).update(data).digest("base64url");

export function createSessionToken(user: string, now = Date.now(), key = secret()): string {
  const payload: Session = { user, exp: now + SESSION_HOURS * 3600_000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data, key)}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
  key?: string,
): Session | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  let expected: string;
  try {
    expected = sign(data, key ?? secret());
  } catch {
    return null; // not configured
  }
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
    if (typeof session.user !== "string" || typeof session.exp !== "number" || session.exp < now) return null;
    return session;
  } catch {
    return null;
  }
}
