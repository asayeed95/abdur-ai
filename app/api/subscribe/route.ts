import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE } from "@/lib/site";

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
  // A welcome email only goes to genuinely new signups — re-welcoming an
  // existing contact would be spammy and would double-send on retries.
  const isNewContact = res.ok;
  if (!res.ok && res.status !== 409) {
    const detail = await res.text().catch(() => "");
    console.error(`[subscribe] Resend ${res.status} for list "${list}": ${detail}`);
    return NextResponse.json({ error: "Could not subscribe right now" }, { status: 502 });
  }

  if (isNewContact && (list === "tldr" || list === "mnemix-beta")) {
    await sendWelcomeEmail({ email, list, apiKey });
  }

  return NextResponse.json({ ok: true });
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
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `welcome-${list}/${email}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
        reply_to: SITE.email,
        unsubscribe: `mailto:${SITE.email}?subject=${unsubSubject}`,
      }),
    });
    if (!sendRes.ok) {
      const detail = await sendRes.text().catch(() => "");
      console.error(`[subscribe] welcome email ${sendRes.status} for ${email} (${list}): ${detail}`);
    }
  } catch (err) {
    console.error(`[subscribe] welcome email failed for ${email} (${list}): ${err instanceof Error ? err.message : String(err)}`);
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
