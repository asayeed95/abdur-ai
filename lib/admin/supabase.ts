import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for /admin (cookie session, @supabase/ssr) on
 * the community project. It runs with the signed-in admin's own JWT — never
 * a service-role key — so the database's RLS (`public.is_admin()`) is the
 * second gate behind the ADMIN_EMAILS check below.
 */
export async function adminSupabase() {
  const store = await cookies();
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; middleware refreshes the session.
        }
      },
    },
  });
}

/** Lowercased allowlist from ADMIN_EMAILS (comma-separated). Empty = nobody. */
export function adminEmails(env: Record<string, string | undefined> = process.env): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdmin(user: Pick<User, "email" | "email_confirmed_at"> | null, allow = adminEmails()): boolean {
  return Boolean(user?.email && user.email_confirmed_at && allow.includes(user.email.toLowerCase()));
}

/**
 * Gate for every /admin page AND every admin server action (actions are
 * public POST endpoints; the page gate does not protect them). Not signed in
 * → login. Signed in but not allowlisted → 404, so the route does not
 * confirm it exists.
 */
export async function requireAdmin() {
  const sb = await adminSupabase();
  if (!sb) notFound();
  // getUser() verifies the JWT with the auth server; getSession() would trust the cookie.
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect("/admin/login");
  if (!isAllowedAdmin(data.user)) notFound();
  return { sb, user: data.user };
}
