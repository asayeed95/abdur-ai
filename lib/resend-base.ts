/**
 * Resend API origin for /api/subscribe.
 *
 * `RESEND_API_BASE_URL` exists only so the signup journey can be tested against
 * a local stand-in (scripts/test-subscribe-journey.mjs). Every call made with
 * this origin carries `Authorization: Bearer ${RESEND_API_KEY}` and subscriber
 * addresses, so the override is honoured ONLY for:
 *   - a loopback host (127.0.0.1, localhost, [::1]), any scheme/port, and
 *   - the real API origin, https://api.resend.com.
 * Anything else (another https host, a typo of the real domain, a leaked
 * preview value) is ignored and the real API is used.
 *
 * Kept free of imports and path aliases so the test harness can import it
 * directly with Node's type stripping.
 */
export const RESEND_API_ORIGIN = "https://api.resend.com";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function resolveResendBase(override: string | undefined): string {
  if (!override) return RESEND_API_ORIGIN;
  let u: URL;
  try {
    u = new URL(override);
  } catch {
    return RESEND_API_ORIGIN;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return RESEND_API_ORIGIN;
  if (LOOPBACK_HOSTS.has(u.hostname)) return u.origin;
  if (u.origin === RESEND_API_ORIGIN) return u.origin;
  return RESEND_API_ORIGIN;
}
