import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  list: z.enum(["tldr", "asec-waitlist", "mnemix-beta"]).optional().default("tldr"),
  // Attribution (A-1). All optional.
  source_path: z.string().max(300).optional(),
  landing_path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  // Anti-spam: honeypot + minimum fill time. Bots get a silent {ok:true}.
  company: z.string().optional(),
  rendered_at: z.coerce.number().optional(),
});

/** Resend custom contact property keys declared and stored by this route. */
const ATTRIBUTION_KEYS = [
  "source_path",
  "landing_path",
  "referrer",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

const MIN_FILL_MS = 1500;

const AUDIENCE_ENV: Record<string, string | undefined> = {
  tldr: process.env.RESEND_AUDIENCE_TLDR,
  "asec-waitlist": process.env.RESEND_AUDIENCE_ASEC,
  "mnemix-beta": process.env.RESEND_AUDIENCE_MNEMIX,
};

/**
 * POST /api/subscribe
 *
 * Adds the email to the Resend audience for the requested list.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { email, list, company, rendered_at, ...attributionInput } = parsed.data;

  // Bot guard: a filled honeypot, or a submit that arrived faster than a
  // human could fill the form, gets a silent success — nothing is written
  // to Resend.
  if (company && company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }
  if (rendered_at !== undefined && Date.now() - rendered_at < MIN_FILL_MS) {
    return NextResponse.json({ ok: true });
  }

  // Requests carrying no attribution fields (e.g. older clients) fall back
  // to the Referer header for same-origin source_path and a stripped
  // referrer.
  const attribution = { ...attributionInput } as Partial<Record<AttributionKey, string>>;
  if (ATTRIBUTION_KEYS.every((key) => !attribution[key])) {
    const referer = req.headers.get("referer");
    if (referer) {
      const stripped = stripToOriginPath(referer);
      if (stripped) {
        attribution.referrer = stripped;
        try {
          const refUrl = new URL(referer);
          if (refUrl.origin === new URL(req.url).origin) {
            attribution.source_path = refUrl.pathname;
          }
        } catch {
          // Malformed referer — keep the stripped value only.
        }
      }
    }
  }

  const audienceId = AUDIENCE_ENV[list];
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !audienceId) {
    console.error(`[subscribe] missing Resend config for list "${list}"`);
    return NextResponse.json(
      { error: "Subscriptions are temporarily unavailable" },
      { status: 503 },
    );
  }

  // Declare the attribution contact properties once per cold start. Failures
  // are logged and non-fatal — attribution must never break subscribing.
  await ensureAttributionProperties(apiKey);

  const properties = nonEmptyProperties(attribution);

  const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, unsubscribed: false, ...(Object.keys(properties).length > 0 ? { properties } : {}) }),
  });

  // 409 = contact already exists; that's a success from the subscriber's view.
  if (!res.ok && res.status !== 409) {
    const detail = await res.text().catch(() => "");
    console.error(`[subscribe] Resend ${res.status} for list "${list}": ${detail}`);
    return NextResponse.json({ error: "Could not subscribe right now" }, { status: 502 });
  }

  // Existing contact: backfill attribution properties that are currently
  // blank. Never overwrite a non-empty value — first non-empty wins, so
  // existing subscribers are never corrupted. Best-effort, non-fatal.
  if (res.status === 409 && Object.keys(properties).length > 0) {
    await backfillAttribution({ email, audienceId, apiKey, properties });
  }

  return NextResponse.json({ ok: true });
}

/** Strip a URL to origin + pathname (drop query/hash — GDPR minimization). */
function stripToOriginPath(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return "";
  }
}

/** Keep only keys with non-empty trimmed values. */
function nonEmptyProperties(
  input: Partial<Record<AttributionKey, string>>,
): Partial<Record<AttributionKey, string>> {
  const out: Partial<Record<AttributionKey, string>> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = input[key];
    if (value && value.trim() !== "") out[key] = value;
  }
  return out;
}

/**
 * Module-scope cache for contact-property declarations so the eight
 * `contact-properties` calls happen once per cold start, not per subscribe.
 * A rejected promise is cleared so the next request retries.
 */
let declarePropertiesPromise: Promise<void> | null = null;

function ensureAttributionProperties(apiKey: string): Promise<void> {
  if (!declarePropertiesPromise) {
    declarePropertiesPromise = (async () => {
      for (const key of ATTRIBUTION_KEYS) {
        try {
          const res = await fetch("https://api.resend.com/contact-properties", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ key, type: "string" }),
          });
          // 409/422 = already declared on a previous run; that's success.
          if (!res.ok && res.status !== 409 && res.status !== 422) {
            const detail = await res.text().catch(() => "");
            console.error(`[subscribe] declare property "${key}" ${res.status}: ${detail}`);
          }
        } catch (err) {
          console.error(`[subscribe] declare property "${key}" failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    })().catch((err) => {
      declarePropertiesPromise = null;
      throw err;
    });
  }
  return declarePropertiesPromise;
}

/**
 * Backfill attribution on an existing contact: PATCH only the properties
 * that are currently empty/missing. First non-empty value wins — a later
 * subscribe never overwrites the attribution of an earlier one.
 */
async function backfillAttribution({
  email,
  audienceId,
  apiKey,
  properties,
}: {
  email: string;
  audienceId: string;
  apiKey: string;
  properties: Partial<Record<AttributionKey, string>>;
}) {
  try {
    const getRes = await fetch(
      `https://api.resend.com/contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!getRes.ok) {
      const detail = await getRes.text().catch(() => "");
      console.error(`[subscribe] attribution backfill GET ${getRes.status} for ${email}: ${detail}`);
      return;
    }
    const contact = (await getRes.json()) as { properties?: Record<string, unknown> };
    const existing = contact.properties ?? {};

    const patch: Partial<Record<AttributionKey, string>> = {};
    for (const [key, value] of Object.entries(properties) as [AttributionKey, string][]) {
      const current = existing[key];
      if (current === undefined || current === null || current === "") {
        patch[key] = value;
      }
    }
    if (Object.keys(patch).length === 0) return;

    const patchRes = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audience_id: audienceId, properties: patch }),
    });
    if (!patchRes.ok) {
      const detail = await patchRes.text().catch(() => "");
      console.error(`[subscribe] attribution backfill PATCH ${patchRes.status} for ${email}: ${detail}`);
    }
  } catch (err) {
    console.error(`[subscribe] attribution backfill failed for ${email}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
