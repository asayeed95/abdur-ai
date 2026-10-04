import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isAllowedAdmin } from "@/lib/admin/allowlist";

export { adminEmails, isAllowedAdmin } from "@/lib/admin/allowlist";

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
