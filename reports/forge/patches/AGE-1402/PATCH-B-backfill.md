# PATCH-B — AGE-1592 leftover empty attribution backfill (201 ≠ 409)

**Repo:** `asayeed95/abdur-ai`  
**File:** `app/api/subscribe/route.ts`  
**Base:** main @ `fdebd2d718ed4056f74fcef8a0d2e960503c5e1b` (re-read tip before apply)  
**Evidence:** `reports/sentinel/2026-09-06-age-1592-attribution-resend-e2e.md` check 2b FAIL

## Current (broken gate)

```ts
if (res.status === 409 && Object.keys(properties).length > 0) {
  await backfillAttribution({ email, audienceId, apiKey, properties });
}

const isNewContact = res.ok;
```

Live Resend: duplicate POST → **201** (not 409) → backfill skipped; `isNewContact` true → welcome may re-fire.

## Intended behavior

1. On create success (`res.ok`, typically 201) **or** classic 409, if `properties` non-empty → call `backfillAttribution` (already empty-only PATCH).  
2. Welcome only for truly new contacts — e.g. GET contact before create; if 404 then create + welcome; if exists then backfill only, no welcome. Alternative: parse create JSON for created-at ≈ now — prefer GET-before when cheap enough.

## Suggested shape (illustrative — writer owns final)

```ts
const pre = await fetch(
  `https://api.resend.com/contacts/${encodeURIComponent(email)}?audience_id=${audienceId}`,
  { headers: { Authorization: `Bearer ${apiKey}` } },
);
const existed = pre.ok;

const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, { /* unchanged POST */ });

if (!res.ok && res.status !== 409) {
  // unchanged 502 path
}

if (Object.keys(properties).length > 0) {
  await backfillAttribution({ email, audienceId, apiKey, properties });
}

if (!existed && (list === "tldr" || list === "mnemix-beta")) {
  await sendWelcomeEmail({ email, list, apiKey });
}
```

Do **not** set secrets in repo. Do **not** invent UTMs. Do **not** open PR from Forge.

## Tests

- First subscribe with props → properties present; welcome once.  
- Second subscribe with additional previously-empty keys → those keys fill; filled keys unchanged; **no** second welcome.  
- Honeypot / min-fill unchanged (no Resend).
