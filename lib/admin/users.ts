// Admin accounts come from ADMIN_USERS: comma-separated "username:passwordHash" pairs.
// Create an entry with `npm run admin:user` (the password is typed there and never stored in plain text).

export function parseUsers(value = process.env.ADMIN_USERS ?? ""): Map<string, string> {
  const users = new Map<string, string>();
  for (const entry of value.split(",")) {
    const i = entry.indexOf(":");
    if (i <= 0) continue;
    const name = entry.slice(0, i).trim().toLowerCase();
    const hash = entry.slice(i + 1).trim();
    if (name && /^scrypt[:$]/.test(hash)) users.set(name, hash);
  }
  return users;
}

/** True when there is at least one account and a session secret: the admin can be used. */
export const adminConfigured = () =>
  parseUsers().size > 0 && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;
