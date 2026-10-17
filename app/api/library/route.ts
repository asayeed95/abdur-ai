import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deliveryLinks, getAsset, isVisible, libraryPath, type LibraryAsset } from "@/lib/library";
import { resolveResendBase } from "@/lib/resend-base";
import { SITE } from "@/lib/site";

/**
 * POST /api/library (AGE-3762)
 *
 * Emails a free library asset to the address given, and, only if the reader
 * ticked the separate, unchecked box, adds them to the TLDR list.
 *
 * Delivery and list consent are separate on purpose:
 *  - The asset email is a one-off, requested delivery. Sending it never adds
 *    the address to any audience, and it reaches an address that unsubscribed
 *    from the list, because they asked for this.
 *  - The list add happens only on an explicit opt-in. An existing contact
 *    (409) is left exactly as it is: an unsubscribed reader is never
 *    re-subscribed by this route. First-touch attribution is backfilled
 *    first-wins, and the asset that brought them in is stored as its own
 *    `lead_asset` property so it never overwrites where they came from.
 *
 * Observations: like /api/subscribe, this route sees what Resend ACCEPTED,
 * never what was delivered or read. A bot-guard rejection answers like a
 * success, so `{ok:true}` means "request handled".
 */

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).email(),
  // Shape-checked here, then looked up in the registry: the id is the only
  // thing about the asset a request can name.
  asset_id: z.string().max(64).regex(/^[a-z0-9-]+$/),
  // A native checkbox posts "on" when ticked and nothing when not; the JS
  // path sends a boolean. Anything else is "not ticked".
  newsletter: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === "on" || v === "true" || v === "1"),
  source_path: z.string().max(300).optional(),
  landing_path: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  utm_term: z.string().max(200).optional(),
  company: z.string().optional(),
  rendered_at: z.coerce.number().optional(),
});

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
/** Contact properties this route writes: first-touch attribution plus the asset. */
const PROPERTY_KEYS = [...ATTRIBUTION_KEYS, "lead_asset"] as const;
type PropertyKey = (typeof PROPERTY_KEYS)[number];

const MIN_FILL_MS = 1500;
const SEND_TIMEOUT_MS = 8000;
const CONTACT_TIMEOUT_MS = 6000;
const BACKFILL_TIMEOUT_MS = 4000;
const DECLARE_TIMEOUT_MS = 4000;

const RESEND = resolveResendBase(process.env.RESEND_API_BASE_URL);

type Newsletter = "added" | "existing" | "skipped" | "failed";

/** Short, non-reversible tag for logs and idempotency keys — no raw addresses. */
function emailTag(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  const ctype = req.headers.get("content-type") ?? "";
  const isNativeForm =
    ctype.includes("application/x-www-form-urlencoded") || ctype.includes("multipart/form-data");

  /**
   * JS clients get JSON. A native form post (JS off) gets a 303 back to the
   * asset's page with a status it renders, or to /library when the id itself
   * was not one we know. The redirect target is only ever built from a
   * registry id.
   */
  const reply = (
    outcome: "sent" | "invalid" | "unavailable",
    asset: LibraryAsset | undefined,
    json: Record<string, unknown>,
    status: number,
  ) => {
    if (isNativeForm) {
      const to = new URL(asset ? libraryPath(asset.id) : "/library", req.url);
      to.searchParams.set(outcome === "sent" ? "sent" : "error", outcome === "sent" ? "1" : outcome);
      return NextResponse.redirect(to, 303);
    }
    return NextResponse.json(json, { status });
  };

  let body: unknown;
  try {
    body = isNativeForm
      ? Object.fromEntries(
          Array.from((await req.formData()).entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
        )
      : await req.json();
  } catch {
    return reply("invalid", undefined, { error: "Invalid request body" }, 400);
  }

  const parsed = schema.safeParse(body);
  // Resolve the asset from the raw body too, so a bad email on a good asset
  // still sends a no-JS reader back to that asset's page.
  const rawId = typeof (body as { asset_id?: unknown })?.asset_id === "string" ? (body as { asset_id: string }).asset_id : "";
  const knownAsset = getAsset(rawId);
  const pageAsset = knownAsset && isVisible(knownAsset) ? knownAsset : undefined;
  if (!parsed.success) {
    const emailProblem = parsed.error.issues.some((i) => i.path[0] === "email");
    return reply(
      "invalid",
      pageAsset,
      { error: emailProblem ? "Enter a valid email address." : "Invalid request." },
      400,
    );
  }
  const { email, asset_id, newsletter, company, rendered_at, ...attributionInput } = parsed.data;

  // Unknown, planned, or (in production) draft: all the same 404, so the
  // endpoint does not reveal what is in the pipeline.
  const asset = getAsset(asset_id);
  if (!asset || !isVisible(asset)) {
    return reply("invalid", undefined, { error: "That item isn’t available." }, 404);
  }

  if (company && company.trim() !== "") {
    return reply("sent", asset, { ok: true }, 200);
  }
  if (rendered_at !== undefined) {
    const elapsed = Date.now() - rendered_at;
    if (elapsed >= 0 && elapsed < MIN_FILL_MS) {
      return reply("sent", asset, { ok: true }, 200);
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[library] missing RESEND_API_KEY");
    return reply("unavailable", asset, { error: "Sending is temporarily unavailable" }, 503);
  }

  // 1. The asset. This is what the reader asked for, so it goes first and it
  //    alone decides success: a failed send changes nothing else.
  const sent = await sendAsset({ email, asset, apiKey });
  if (!sent) {
    return reply("unavailable", asset, { error: "Could not send it right now. Try again in a minute." }, 502);
  }

  // 2. The list, only on an explicit opt-in. Best-effort: the asset is
  //    already on its way, so a list failure is reported, never fatal.
  let list: Newsletter = "skipped";
  if (newsletter) {
    const attribution = { ...attributionInput } as Partial<Record<AttributionKey, string>>;
    list = await addToTldr({ email, asset, apiKey, attribution });
  }

  return reply("sent", asset, { ok: true, delivered: true, newsletter: list }, 200);
}

/**
 * Sends the delivery email. The idempotency key is the asset plus a hash of
 * the address, so a double submit, a retry after a timeout, or two tabs send
 * one email per asset per address per day (Resend keeps keys for 24 hours).
 * The body never depends on anything but the asset, so a repeat request
 * carries the same payload and is deduplicated rather than rejected.
 *
 * Resend answers 409 when the key is already in use (a concurrent request
 * holding it, or the same key with a different payload). In both cases an
 * email for this asset and address is already sent or in flight, so it
 * counts as delivered.
 */
async function sendAsset({
  email,
  asset,
  apiKey,
}: {
  email: string;
  asset: LibraryAsset;
  apiKey: string;
}): Promise<boolean> {
  const links = deliveryLinks(asset.id);
  const html = `<!doctype html>
<html lang="en">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#1a1a1a;background:#ffffff;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;">
      <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">
        Here&rsquo;s your copy of ${escapeHtml(asset.title)}.
      </p>
      <p style="font-size:16px;line-height:1.6;margin:0 0 8px;">
        <a href="${links.read}">Read it on the site</a> (prints cleanly), or
        <a href="${links.download}">download the editable Markdown</a> and make it yours.
      </p>
      <p style="font-size:16px;line-height:1.6;margin:24px 0 32px;">
        &mdash; Abdur
      </p>
      <p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#888;margin:0;">
        You requested this at abdur.ai. It&rsquo;s a one-off delivery; on its own it
        doesn&rsquo;t add you to any list.
      </p>
    </div>
  </body>
</html>`;
  const text = `Here's your copy of ${asset.title}.

Read it on the site: ${links.read}
Download the editable Markdown: ${links.download}

- Abdur

You requested this at abdur.ai. It's a one-off delivery; on its own it doesn't add you to any list.`;

  try {
    const res = await fetch(`${RESEND}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `asset-${asset.id}/${emailTag(email)}`,
      },
      body: JSON.stringify({
        from: `${SITE.author} <${SITE.email}>`,
        to: [email],
        subject: `Your copy: ${asset.title}`,
        html,
        text,
        reply_to: SITE.email,
        // Counted in Resend per asset; no address or user input in tags.
        tags: [
          { name: "kind", value: "library" },
          { name: "asset", value: asset.id },
        ],
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (res.ok || res.status === 409) return true;
    const detail = await res.text().catch(() => "");
    console.error(`[library] asset email ${res.status} for ${emailTag(email).slice(0, 8)} (${asset.id}): ${detail}`);
    return false;
  } catch (err) {
    console.error(
      `[library] asset email failed for ${emailTag(email).slice(0, 8)} (${asset.id}): ${err instanceof Error ? err.name : String(err)}`,
    );
    return false;
  }
}

/**
 * Adds an opted-in reader to the TLDR audience. A new contact is created
 * subscribed, with attribution and `lead_asset`. An existing contact (409)
 * keeps its subscription state untouched — never re-subscribed — and only
 * has blank properties filled in, first non-empty value wins.
 */
async function addToTldr({
  email,
  asset,
  apiKey,
  attribution,
}: {
  email: string;
  asset: LibraryAsset;
  apiKey: string;
  attribution: Partial<Record<AttributionKey, string>>;
}): Promise<Newsletter> {
  const audienceId = process.env.RESEND_AUDIENCE_TLDR;
  if (!audienceId) {
    console.error("[library] missing RESEND_AUDIENCE_TLDR; opt-in not recorded");
    return "failed";
  }
  await Promise.race([ensureProperties(apiKey), new Promise<void>((r) => setTimeout(r, 3000))]);

  const properties: Partial<Record<PropertyKey, string>> = { lead_asset: asset.id };
  for (const key of ATTRIBUTION_KEYS) {
    const v = attribution[key];
    if (v && v.trim() !== "") properties[key] = v;
  }

  let res: Response;
  try {
    res = await fetch(`${RESEND}/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false, properties }),
      signal: AbortSignal.timeout(CONTACT_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[library] TLDR add failed for ${emailTag(email).slice(0, 8)}: ${err instanceof Error ? err.name : String(err)}`);
    return "failed";
  }
  if (res.ok) return "added";
  if (res.status !== 409) {
    const detail = await res.text().catch(() => "");
    console.error(`[library] TLDR add ${res.status} for ${emailTag(email).slice(0, 8)}: ${detail}`);
    return "failed";
  }
  await backfill({ email, audienceId, apiKey, properties });
  return "existing";
}

/** Fill only blank properties on an existing contact. Never touches `unsubscribed`. */
async function backfill({
  email,
  audienceId,
  apiKey,
  properties,
}: {
  email: string;
  audienceId: string;
  apiKey: string;
  properties: Partial<Record<PropertyKey, string>>;
}) {
  const tag = emailTag(email).slice(0, 8);
  try {
    const getRes = await fetch(`${RESEND}/contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(BACKFILL_TIMEOUT_MS),
    });
    if (!getRes.ok) {
      console.error(`[library] backfill GET ${getRes.status} for ${tag}`);
      return;
    }
    const existing = ((await getRes.json()) as { properties?: Record<string, unknown> }).properties ?? {};
    const patch: Partial<Record<PropertyKey, string>> = {};
    for (const [key, value] of Object.entries(properties) as [PropertyKey, string][]) {
      const current = existing[key];
      if (current === undefined || current === null || current === "") patch[key] = value;
    }
    if (Object.keys(patch).length === 0) return;
    const patchRes = await fetch(`${RESEND}/contacts/${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ audience_id: audienceId, properties: patch }),
      signal: AbortSignal.timeout(BACKFILL_TIMEOUT_MS),
    });
    if (!patchRes.ok) console.error(`[library] backfill PATCH ${patchRes.status} for ${tag}`);
  } catch (err) {
    console.error(`[library] backfill failed for ${tag}: ${err instanceof Error ? err.name : String(err)}`);
  }
}

/** Declare the contact properties once per cold start; a partial failure is retried next time. */
let declared: Promise<void> | null = null;
function ensureProperties(apiKey: string): Promise<void> {
  if (!declared) {
    declared = (async () => {
      const results = await Promise.allSettled(
        PROPERTY_KEYS.map(async (key) => {
          const res = await fetch(`${RESEND}/contact-properties`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ key, type: "string" }),
            signal: AbortSignal.timeout(DECLARE_TIMEOUT_MS),
          });
          if (!res.ok && res.status !== 409 && res.status !== 422) throw new Error(`declare "${key}" ${res.status}`);
        }),
      );
      const failed = results.filter((x): x is PromiseRejectedResult => x.status === "rejected");
      for (const f of failed) console.error(`[library] ${f.reason instanceof Error ? f.reason.message : String(f.reason)}`);
      if (failed.length > 0) declared = null;
    })();
  }
  return declared;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
