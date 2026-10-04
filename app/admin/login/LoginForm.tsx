"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

/** Admin sign-in. Access is still decided server-side (ADMIN_EMAILS + RLS). */
export function LoginForm() {
  const url = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_COMMUNITY_SUPABASE_PUBLISHABLE_KEY;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "oauth-error">("idle");
  if (!url || !key) return <p className="text-sm text-meta">Admin is not configured on this deployment.</p>;
  // Built on demand: client components also render on the server, where
  // there is no window and no browser storage.
  const client = () => createBrowserClient(url, key);
  const redirectTo = () => `${window.location.origin}/admin/auth/callback`;

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="w-full font-mono text-xs tracking-widest uppercase border border-border px-4 py-3 rounded-sm hover:border-clay cursor-pointer"
        onClick={async () => {
          // Returns { error } rather than throwing, e.g. while the GitHub provider is off.
          const { error } = await client().auth.signInWithOAuth({ provider: "github", options: { redirectTo: redirectTo() } });
          if (error) setState("oauth-error");
        }}
      >
        Continue with GitHub
      </button>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setState("sending");
          const { error } = await client().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: false } });
          setState(error ? "error" : "sent");
        }}
      >
        <label htmlFor="admin-email" className="sr-only">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-w-0 bg-surface border border-border rounded-sm px-3 py-2 text-sm"
          placeholder="you@…"
        />
        <button type="submit" className="font-mono text-xs uppercase tracking-widest bg-clay text-bg px-4 rounded-sm cursor-pointer">
          Email link
        </button>
      </form>
      <p aria-live="polite" className="font-mono text-[11px] text-meta">
        {state === "sent" ? "If that address has an account, a sign-in link is on its way." : state === "error" ? "Could not send a link." : state === "oauth-error" ? "GitHub sign-in is not available right now. Use the email link." : ""}
      </p>
    </div>
  );
}
