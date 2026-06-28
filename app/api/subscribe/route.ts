import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  list: z.enum(["tldr", "asec-waitlist", "mnemix-beta"]).optional().default("tldr"),
});

/**
 * POST /api/subscribe
 *
 * Wires to Resend (or ConvertKit, or whatever email tool you pick).
 * Currently a stub that logs and returns success — replace the body
 * with the real provider call.
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
  const { email, list } = parsed.data;

  // TODO(claude-code): wire to Resend or ConvertKit.
  // Example with Resend Audiences:
  //
  //   import { Resend } from 'resend';
  //   const resend = new Resend(process.env.RESEND_API_KEY!);
  //   await resend.contacts.create({
  //     email,
  //     audienceId: list === 'asec-waitlist'
  //       ? process.env.RESEND_AUDIENCE_ASEC!
  //       : process.env.RESEND_AUDIENCE_TLDR!,
  //   });

  console.log(`[subscribe] ${list}: ${email}`);

  return NextResponse.json({ ok: true });
}
