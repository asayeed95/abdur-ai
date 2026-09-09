/**
 * Subscriber attribution — client-only capture of first-touch session
 * attribution (UTMs, landing path, referrer) persisted to sessionStorage.
 *
 * First-touch: once `abdur_attr_v1` is written for a session it is never
 * overwritten — a visitor who lands on a post from a campaign and subscribes
 * later on the subscribe page still carries the campaign as their source.
 *
 * GDPR minimization: document.referrer is stripped to origin + pathname;
 * query strings and hashes are never stored.
 */

export type Attribution = {
  landing_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

const STORAGE_KEY = "abdur_attr_v1";
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** Strip a URL-ish string to origin + pathname. Returns "" on failure. */
export function stripToOriginPath(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return "";
  }
}

function isExternal(referrer: string): boolean {
  try {
    return new URL(referrer).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Capture first-touch attribution for this session. Idempotent: if a record
 * already exists in sessionStorage it is returned unchanged.
 */
export function captureAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing) as Attribution;
  } catch {
    // Corrupt/unreadable storage — recapture.
  }

  const params = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) attr[key] = value;
  }
  const referrer = document.referrer ? stripToOriginPath(document.referrer) : "";

  const hasUtm = UTM_KEYS.some((key) => attr[key]);
  if (!hasUtm && (!referrer || !isExternal(referrer))) {
    // Organic same-site session — nothing worth persisting.
    return {};
  }

  attr.landing_path = window.location.pathname;
  if (referrer) attr.referrer = referrer;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    // Storage full/blocked — attribution is best-effort, never fatal.
  }
  return attr;
}

/** Read the session's stored attribution, capturing first if needed. */
export function getAttribution(): Attribution {
  return captureAttribution();
}

/**
 * Build the /api/subscribe payload fields for a form mounted at sourcePath.
 * Only non-empty values are included.
 */
export function buildSubscribeFields(sourcePath: string): Record<string, string> {
  const attr = getAttribution();
  const fields: Record<string, string> = { source_path: sourcePath };
  for (const [key, value] of Object.entries(attr)) {
    if (value) fields[key] = value;
  }
  return fields;
}
