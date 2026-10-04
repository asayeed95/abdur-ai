/**
 * The app half of the /admin gate (AGE-2974), kept free of Next and Supabase
 * imports so it can be unit-tested (mcp/abdur-ai/test/admin-allowlist.test.ts).
 * The database half is public.admins + is_admin() (supabase/community).
 */

/** Lowercased allowlist from ADMIN_EMAILS (comma-separated). Empty = nobody. */
export function adminEmails(env: Record<string, string | undefined> = process.env): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Allowlisted AND the email is confirmed (an unconfirmed address proves nothing). */
export function isAllowedAdmin(
  user: { email?: string | null; email_confirmed_at?: string | null } | null,
  allow = adminEmails(),
): boolean {
  return Boolean(user?.email && user.email_confirmed_at && allow.includes(user.email.toLowerCase()));
}
