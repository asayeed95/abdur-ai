import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  list: z.enum(["tldr", "asec-waitlist", "mnemix-beta"]).optional().default("tldr"),
});

const AUDIENCE_ENV: Record<string, string | undefined> = {
  tldr: process.env.RESEND_AUDIENCE_TLDR,
  "asec-waitlist": process.env.RESEND_AUDIENCE_ASEC,
  "mnemix-beta": process.env.RESEND_AUDIENCE_MNEMIX,
};

/**
 * Reads the request body as either JSON or a native form post
 * (application/x-www-form-urlencoded). Returns null when the body can't be
 * parsed or the content type is unsupported.
 */
async function parseBody(req: Request): Promise<unknown | null> {
  const contentType = req.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      return await req.json();
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(await req.text());
      const body: Record<string, string> = {};
      for (const [key, value] of params) {
        // Empty form fields (e.g. an unfilled optional input) should fall
        // back to the schema defaults rather than fail the enum check.
        if (value !== "") body[key] = value;
      }
      return body;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * POST /api/subscribe
 *
 * Adds the email to the Resend audience for the requested list.
 * Accepts JSON (the client component) and urlencoded form posts
 * (native <form> fallback when JS doesn't run).
 */
export async function POST(req: Request) {
  const body = await parseBody(req);
  if (body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const { email, list } = parsed.data;

  const audienceId = AUDIENCE_ENV[list];
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !audienceId) {
    console.error(`[subscribe] missing Resend config for list "${list}"`);
    return NextResponse.json(
      { error: "Subscriptions are temporarily unavailable" },
      { status: 503 },
    );
  }

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  // 409 = contact already exists; that's a success from the subscriber's view.
  if (!res.ok && res.status !== 409) {
    const detail = await res.text().catch(() => "");
    console.error(`[subscribe] Resend ${res.status} for list "${list}": ${detail}`);
    return NextResponse.json({ error: "Could not subscribe right now" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
