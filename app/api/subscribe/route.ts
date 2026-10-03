import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { resolveResendBase } from "@/lib/resend-base";
import { SITE } from "@/lib/site";
import { z } from "zod";

const schema = z.object({
  // Normalised before use so "Ada@Example.com " and "ada@example.com" are one
  // contact and one idempotency key, not two welcome emails.
  // 254 = RFC 5321 path limit; zod's email check alone accepts arbitrarily long addresses.
  email: z.string().trim().toLowerCase().max(254).email(),
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

/** Bound every provider call: a hung Resend request must not hold a signup open. */
const CONTACT_TIMEOUT_MS = 8000;
const WELCOME_TIMEOUT_MS = 5000;
/** The existing-contact backfill and the one-time property declarations are best-effort and bounded too. */
const BACKFILL_TIMEOUT_MS = 5000;
const DECLARE_TIMEOUT_MS = 4000;

const AUDIENCE_ENV: Record<string, string | undefined> = {
  tldr: process.env.RESEND_AUDIENCE_TLDR,
  "asec-waitlist": process.env.RESEND_AUDIENCE_ASEC,
  "mnemix-beta": process.env.RESEND_AUDIENCE_MNEMIX,
};

/**
 * Resend API origin. `RESEND_API_BASE_URL` is a test-only override, honoured
 * only for loopback or the real https://api.resend.com origin; see
 * lib/resend-base.ts for why (the key and addresses travel with every call).
 */
const RESEND = resolveResendBase(process.env.RESEND_API_BASE_URL);

/** Short, non-reversible tag for logs and idempotency keys — no raw addresses. */
function emailTag(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 32);
}

/**
 * POST /api/subscribe
 *
 * Adds the email to the Resend audience for the requested list.
 *
 * Observations this route can and cannot make (see the signup audit):
 *  - It can see that Resend ACCEPTED the contact (HTTP 2xx/409).
 *  - It cannot see that a welcome email was delivered or read; the welcome
 *    send is best-effort and its outcome is only logged.
 *  - A bot-guard rejection returns the same `{ok:true}` as a real signup on
 *    purpose, so `{ok:true}` means "request handled", not "contact stored".
 */
export async function POST(req: Request) {
  // JSON from the JS path; application/x-www-form-urlencoded from a native
  // form post when JS is off. Both reach the same schema.
  let body: unknown;
  const ctype = req.headers.get("content-type") ?? "";
  const isNativeForm =
    ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data");

  /**
   * One place that shapes every outcome. JS clients get JSON. A native form
   * post (JS off) is navigated, so it gets a 303 back to /subscribe with a
   * status the page renders — never a raw JSON document in the address bar.
   */
  const reply = (
    outcome: "ok" | "invalid" | "unavailable",
    json: Record<string, unknown>,
    status: number,
  ) => {
    if (isNativeForm) {
      const to = new URL("/subscribe", req.url);
      to.searchParams.set(outcome === "ok" ? "subscribed" : "error", outcome === "ok" ? "1" : outcome);
      return NextResponse.redirect(to, 303);
    }
    return NextResponse.json(json, { status });
  };

  try {
    if (isNativeForm) {
      body = Object.fromEntries(
        Array.from((await req.formData()).entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
      );
    } else {
      body = await req.json();
    }
  } catch {
    return reply("invalid", { error: "Invalid request body" }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    // Never hand zod's raw issue list to the browser — it renders verbatim in
    // the form's error line.
    const emailProblem = parsed.error.issues.some((i) => i.path[0] === "email");
    return reply(
      "invalid",
      { error: emailProblem ? "Enter a valid email address." : "Invalid request." },
      400,
    );
  }
  const { email, list, company, rendered_at, ...attributionInput } = parsed.data;

  // Bot guard: a filled honeypot, or a submit that arrived faster than a
  // human could fill the form, gets a silent success — nothing is written
  // to Resend.
  if (company && company.trim() !== "") {
    return reply("ok", { ok: true }, 200);
  }
  // rendered_at is the BROWSER's clock; the server's is unrelated. A visitor
  // whose clock runs ahead yields a negative elapsed and must not be treated
  // as a bot — only a small, positive elapsed is evidence of a scripted submit.
  if (rendered_at !== undefined) {
    const elapsed = Date.now() - rendered_at;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      return reply("ok", { ok: true }, 200);
    }
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
    return reply("unavailable", { error: "Subscriptions are temporarily unavailable" }, 503);
  }

  // Declare the attribution contact properties once per cold start. Failures
  // are logged and non-fatal — attribution must never break subscribing.
  // Bounded: Resend's default limit is 10 rps team-wide, and eight
  // declarations must never stand between a subscriber and the audience.
  await Promise.race([
    ensureAttributionProperties(apiKey),
    new Promise<void>((resolve) => setTimeout(resolve, 3000)),
  ]);

  const properties = nonEmptyProperties(attribution);

  let res: Response;
  try {
    res = await fetch(`${RESEND}/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, unsubscribed: false, ...(Object.keys(properties).length > 0 ? { properties } : {}) }),
      signal: AbortSignal.timeout(CONTACT_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure or timeout. The outcome at Resend is UNKNOWN (it may
    // have stored the contact before the connection died), so say "try again"
    // — a retry lands as a 409, which is a success, never a duplicate.
    console.error(
      `[subscribe] Resend contact call failed for list "${list}" (${emailTag(email).slice(0, 8)}): ${err instanceof Error ? err.name : String(err)}`,
    );
    return reply("unavailable", { error: "Could not subscribe right now" }, 502);
  }

  // 409 = contact already exists; that's a success from the subscriber's view.
  if (!res.ok && res.status !== 409) {
    const detail = await res.text().catch(() => "");
    console.error(`[subscribe] Resend ${res.status} for list "${list}": ${detail}`);
    return reply("unavailable", { error: "Could not subscribe right now" }, 502);
  }

  // Existing contact: backfill attribution properties that are currently
  // blank. Never overwrite a non-empty value — first non-empty wins, so
  // existing subscribers are never corrupted. Best-effort, non-fatal.
  if (res.status === 409 && Object.keys(properties).length > 0) {
    await backfillAttribution({ email, audienceId, apiKey, properties });
  }

  const isNewContact = res.ok;
  // Welcome email for brand-new subscribers on the two lists that get one —
  // restored from main; the attribution branch had dropped it.
  if (isNewContact && (list === "tldr" || list === "mnemix-beta")) {
    await sendWelcomeEmail({ email, list, apiKey });
  }

  return reply("ok", { ok: true }, 200);
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
 * Any failed declaration clears the cache so the next request retries the
 * set — a partial success is never cached as done.
 */
let declarePropertiesPromise: Promise<void> | null = null;

function ensureAttributionProperties(apiKey: string): Promise<void> {
  if (!declarePropertiesPromise) {
    declarePropertiesPromise = (async () => {
      const results = await Promise.allSettled(
        ATTRIBUTION_KEYS.map(async (key) => {
          const res = await fetch(`${RESEND}/contact-properties`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ key, type: "string" }),
            signal: AbortSignal.timeout(DECLARE_TIMEOUT_MS),
          });
          // 409/422 = already declared on a previous run; that's success.
          if (!res.ok && res.status !== 409 && res.status !== 422) {
            const detail = await res.text().catch(() => "");
            throw new Error(`declare property "${key}" ${res.status}: ${detail}`);
          }
        }),
      );
      const failed = results.filter((x): x is PromiseRejectedResult => x.status === "rejected");
      for (const f of failed) console.error(`[subscribe] ${f.reason instanceof Error ? f.reason.message : String(f.reason)}`);
      if (failed.length > 0) {
        // Do not cache a partial success: the next request retries the set.
        declarePropertiesPromise = null;
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
      `${RESEND}/contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(BACKFILL_TIMEOUT_MS) },
    );
    if (!getRes.ok) {
      const detail = await getRes.text().catch(() => "");
      console.error(`[subscribe] attribution backfill GET ${getRes.status} for ${emailTag(email).slice(0, 8)}: ${detail}`);
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

    const patchRes = await fetch(`${RESEND}/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audience_id: audienceId, properties: patch }),
      signal: AbortSignal.timeout(BACKFILL_TIMEOUT_MS),
    });
    if (!patchRes.ok) {
      const detail = await patchRes.text().catch(() => "");
      console.error(`[subscribe] attribution backfill PATCH ${patchRes.status} for ${emailTag(email).slice(0, 8)}: ${detail}`);
    }
  } catch (err) {
    console.error(`[subscribe] attribution backfill failed for ${emailTag(email).slice(0, 8)}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Sends one welcome email to a brand-new subscriber. Best-effort: a send
 * failure is logged but does not fail the subscribe — the contact is already
 * on the audience, which is the subscriber's primary expectation. Uses an
 * idempotency key derived from list + email so a retry never double-sends.
 *
 * Two lists get a welcome, each honest about now vs later, no price:
 *  - tldr:        the logbook voice — what ships now, no product tour.
 *  - mnemix-beta: the Northsun waitlist — logbook now, Northsun when it opens.
 */
async function sendWelcomeEmail({
  email,
  list,
  apiKey,
}: {
  email: string;
  list: "tldr" | "mnemix-beta";
  apiKey: string;
}) {
  const from = `${SITE.author} <${SITE.email}>`;
  const { subject, bodyHtml, unsubSubject } = welcomeContent(list);
  const html = `<!doctype html>
<html lang="en">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#1a1a1a;background:#ffffff;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;">
      ${bodyHtml}
      <p style="font-size:16px;line-height:1.6;margin:24px 0 32px;">
        &mdash; Abdur
      </p>
      <p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#888;margin:0;">
        You signed up at abdur.ai. Reply to this email if you ever want off
        the list &mdash; one click, no questions.
      </p>
    </div>
  </body>
</html>`;

  try {
    const sendRes = await fetch(`${RESEND}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-${list}/${emailTag(email)}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
        reply_to: SITE.email,
        // `unsubscribe` is not a documented body field of POST /emails; the
        // documented way to carry the header is `headers`.
        headers: { "List-Unsubscribe": `<mailto:${SITE.email}?subject=${unsubSubject}>` },
      }),
      signal: AbortSignal.timeout(WELCOME_TIMEOUT_MS),
    });
    if (!sendRes.ok) {
      const detail = await sendRes.text().catch(() => "");
      console.error(`[subscribe] welcome email ${sendRes.status} for ${emailTag(email).slice(0, 8)} (${list}): ${detail}`);
    }
  } catch (err) {
    console.error(`[subscribe] welcome email failed for ${emailTag(email).slice(0, 8)} (${list}): ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Per-list welcome content, shipped verbatim per founder direction. No
 * closer, no price. The mnemix-beta copy never claims Northsun is available
 * now — "when access actually opens" is future tense, not the gated
 * "available/ready now/today" form.
 */
function welcomeContent(list: "tldr" | "mnemix-beta"): {
  subject: string;
  bodyHtml: string;
  unsubSubject: string;
} {
  if (list === "mnemix-beta") {
    return {
      subject: "You’re on the list",
      unsubSubject: "Unsubscribe%20Northsun%20waitlist",
      bodyHtml: `      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
        You’re on the list for when access actually opens. Until then you
        get the public TLDRs I’m already shipping. The product comes when
        it’s real, not as a finished platform today.
      </p>`,
    };
  }
  return {
    subject: "You’re on the logbook",
    unsubSubject: "Unsubscribe%20TLDR",
    bodyHtml: `      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
        You’re in. Next time I ship a TLDR — pager, phone-number, whatever I
        learn the hard way — it comes here. Not a product tour. The essays
        as they go out.
      </p>`,
  };
}
