# ADR DRAFT — Autonomous X publish loop (Claude-approval-is-signature)

- **Status:** DRAFT · not armed · HARD PAUSE until founder unpause
- **Date:** 2026-09-25 ~8:30 PM ET
- **Author:** Orbit (Build & Truth)
- **Product:** Founder-authorized standing permission — **X posts only** to `@Abdur_sayeed` (Premium+ / complimentary SuperGrok Heavy). No DMs, no follows/unfollows, no likes/reposts except when the approved draft itself is a reply/quote of a named post, no other accounts (`@Northsun` out of scope until a separate ADR).
- **Related standing lock:** `#northsun-agent-bridge` pin `1790347021.244939` — Claude Tag = Abdur 2.0 for X approval; product cadence → `#abdur-ai` `C0BTVUX1YH5`. This ADR **extends** that lock with a Grok execute seat for already-approved text; it does **not** let Grok invent or second-approve copy.

---

## Packet fields (required)

### Hypothesis
If Claude Tag’s Slack **APPROVE** on a designated draft is treated as the sole founder signature, then Grok (Orbit or a dedicated publisher seat using the signed-in `@Abdur_sayeed` browser session / approved X API path) can publish every such post without per-post Abdur re-approval, at any daily volume the Premium+ account allows, while Orbit never invents copy and never expands into DMs/follows/other accounts.

### Baseline (today)
1. Draft lands in Slack (`#abdur-ai` or Claude-owned thread).
2. Claude Tag pull-only: acts when real-`@Claude` with draft/link; APPROVE / HOLD with reason.
3. Publish is still **manual or Claude-connector**: Orbit/Grok **must not** publish under current office hard-stop (“Orbit never merges/publishes from Grok”) unless this ADR is accepted **and** founder unpauses the job.
4. Abdur is not in the approve loop for voice-matching drafts (standing lock). Volume is bottlenecked by human/Claude connector steps after APPROVE, not by Premium+ limits.

### Target
**Claude-approval-is-signature autonomous publish.**
- Intake: designated Slack channel/thread (default `#abdur-ai`; exact channel + marker syntax locked in Unpause step).
- Gate: Claude Tag message containing an explicit APPROVE marker for a concrete draft body (or attached canonical draft link).
- Execute: Grok publishes that exact body to `@Abdur_sayeed` X timeline (or reply/quote only if the approved packet names the target post id).
- Cadence: continuous / any volume within X rate limits — no daily cap in this ADR; rate-limit backoff is operational, not a second approval gate.
- No per-post Abdur ping. No Orbit second-approve. HOLD or missing marker ⇒ no publish.

### evidence_gate
A post may publish **only** when all of the following are true and receipted:

| Check | Proof |
| --- | --- |
| Designated venue | Message is in the locked channel/thread id (not DMs, not random channels). |
| Approver identity | Author is Claude Tag Slack user `U0B4D5VB012` (or successor id named in Unpause). |
| Explicit APPROVE | Verbatim marker e.g. `X-APPROVE` / `APPROVE FOR X @Abdur_sayeed` (exact string locked at Unpause) — emoji-only or “lgtm” alone is **not** enough. |
| Bound draft | Approved message quotes or links the **exact** draft body (or hash of body) to publish; ambiguous “ship it” without body = BLOCKED. |
| Scope | Packet is X timeline post (or named reply/quote). Mentions of DM/follow/settings = out of scope → no action. |
| Account | Target handle is `@Abdur_sayeed` only. |
| Idempotency | `idempotency_key` = Slack `ts` (or thread_ts + draft hash). Already-published key ⇒ skip. |
| Not HOLD | Any HOLD / reject / “needs numbers” in the approval message or later in-thread supersede ⇒ no publish. |

Falsifier: publishing without a receipt that includes approver id, marker, draft hash/body, and X post URL/id means the loop is broken — pause job.

### next_consequence

| Event | Action |
| --- | --- |
| Publish success | Receipt: Slack ts, draft hash, X post URL/id, account `@Abdur_sayeed`, timestamp ET. Mirror one-line ack in the approval thread. |
| Transient X/API/browser failure | Retry with backoff (e.g. 1m / 5m / 15m, max 3). If still fail → BLOCKED receipt in thread; **do not** ask Abdur; optional escalate to Claude Tag only. |
| Rate limit | Queue remaining approved items; resume when window opens. Do not drop APPROVE packets. |
| Bad post already live (wrong text, PII, legal/financial) | Immediate HARD PAUSE of the loop. Delete/unpublish only if founder or Claude Tag explicitly orders it in Slack (separate ask). File incident receipt. |
| Marker ambiguous / draft drift | Do not publish. Reply in thread: BLOCKED + missing gate field. |
| Session logout / Premium drop | Pause. Surface to founder for re-auth; do not scrape credentials from chat. |
| Scope creep ask (DM, follow, other account) | Refuse; cite this ADR product scope. |

### product (standing permission)
- **Who grants:** Founder (Abdur), once, via explicit Unpause language below.
- **What is granted:** Grok may **execute** X publishes of Claude-approved packets to `@Abdur_sayeed` without further Abdur confirmation.
- **What is not granted:** DMs, follows, unfollows, likes, bookmarks, list edits, settings, billing, other X accounts, Telegram, abdur.ai CMS publish (still Claude/Hermes paths).
- **Who still owns copy quality:** Claude Tag (approve voice-matching drafts; HOLD unverified claims/numbers, client/deal names, legal/financial advice).
- **Who never invents posts:** Grok does not author X copy under this ADR; only relays approved text.

---

## Evidence Gate

Falsifier at the **Claude Code execution boundary**: every prompt Claude Code runs in the publish loop must carry a verifiable Slack approval artifact. The loop checks that artifact **before** any X publish action. A post without a valid artifact is **blocked, not published**.

### (1) Artifact shape
A structured block injected into (or attached beside) every Claude Code publish prompt. Required fields:

```
APPROVAL_ARTIFACT:
  slack_permalink: https://northsun.slack.com/archives/<CHANNEL_ID>/p<COMPACT_TS>
  slack_ts: "<SECONDS.MICROSECONDS>"
  slack_channel_id: "<CHANNEL_ID>"
  approver_user_id: "U0B4D5VB012"
  approver_display: "Claude Tag"
  approve_marker: "<LOCKED_MARKER_STRING>"
  draft_sha256: "<hex of exact bytes to post>"
  target_handle: "@Abdur_sayeed"
  idempotency_key: "<slack_ts>+<draft_sha256>"
```

- `slack_permalink` must resolve to the Claude Tag APPROVE message (not the draft alone).
- `slack_ts` must match the permalink’s message timestamp.
- `approver_user_id` must be the locked Claude Tag id (default `U0B4D5VB012` until Unpause names a successor).
- `slack_channel_id` must be the founder-locked designated venue (default `#abdur-ai` / `C0BTVUX1YH5` until Unpause).
- Missing any field ⇒ artifact malformed.

### (2) Pre-publish check (Claude Code boundary)
Before Claude Code (or any executor prompted by this loop) may open compose, call the X API, or click Post:

1. Parse `APPROVAL_ARTIFACT` from the active prompt / packet.
2. Verify `slack_channel_id` ∈ allowlist (designated venue only).
3. Verify `approver_user_id` ∈ allowlist (Claude Tag only).
4. Verify `approve_marker` equals the locked marker string.
5. Re-fetch Slack message at `slack_permalink` / (`channel_id`,`ts`) and confirm: author matches, marker present, no later HOLD in-thread superseding, and message body (or linked draft) hashes to `draft_sha256`.
6. Verify `target_handle` is `@Abdur_sayeed` and `idempotency_key` not already published.
7. Only then may the publish step run. The publish prompt itself must still include the same artifact (no stripped “just post this” follow-up).

### (3) Failure mode
| Condition | Result |
| --- | --- |
| Artifact missing from Claude Code prompt | **BLOCK** — do not publish; log `X_PUBLISH_BLOCKED reason=missing_artifact`; optional Slack thread note. |
| Malformed / incomplete fields | **BLOCK** — `reason=malformed_artifact`; do not invent defaults. |
| Permalink/ts mismatch or Slack fetch fails | **BLOCK** — `reason=artifact_unverified`. |
| Approver not Claude Tag | **BLOCK** — `reason=approver_not_allowed`. |
| Channel/thread not on allowlist | **BLOCK** — `reason=channel_not_approved`. |
| Marker wrong / HOLD supersede / draft hash drift | **BLOCK** — `reason=gate_failed`. |
| Idempotency hit | **SKIP** — already published; not a new post. |

No Abdur re-approval ask on block. Escalate to Claude Tag in-thread only if the packet looked intentional but failed verification.

### (4) Sample log lines

Passed:
```
2026-09-25T20:34:00-04:00 X_PUBLISH_PASS handle=@Abdur_sayeed idempotency_key=1790347021.244939+a1b2c3d4 channel=C0BTVUX1YH5 ts=1790347021.244939 approver=U0B4D5VB012 marker=X-APPROVE draft_sha256=a1b2c3d4… x_url=https://x.com/Abdur_sayeed/status/…
```

Blocked:
```
2026-09-25T20:34:12-04:00 X_PUBLISH_BLOCKED reason=missing_artifact handle=@Abdur_sayeed prompt_id=cc-run-77 action=no_publish
```

Blocked (wrong venue):
```
2026-09-25T20:34:18-04:00 X_PUBLISH_BLOCKED reason=channel_not_approved channel=C0BT932R70U expected=C0BTVUX1YH5 ts=17903….… approver=U0B4D5VB012 action=no_publish
```

---

## HARD PAUSE / Unpause (mandatory)

Orbit office **HARD PAUSE** on recurring jobs remains in force. This loop **must not** be created, resumed, or polled until founder unpauses **this ADR by name**.

### Unpause step (founder must say, in Slack or Grok chat)
Exact intent (paraphrase OK if all bullets covered):

1. “**Unpause ADR Autonomous X publish (Claude-signature)**”
2. Confirm designated Slack venue (channel id + optional thread).
3. Confirm APPROVE marker string.
4. Confirm execute seat (Orbit browser session vs named publisher) and that `@Abdur_sayeed` Premium+ session is the only target.
5. Confirm: Claude Tag APPROVE = signature; no per-post Abdur re-approval.

Until that message exists and is receipted, any routine/listener for this loop stays **paused or uncreated**. Accepting this ADR as text ≠ arming it.

### Pause / revoke
Any of: founder “pause X publish loop”; Claude Tag “pause autonomous X”; bad-post incident; session loss → job pauses immediately. Revoke standing permission requires founder sentence; memory of a grant alone is not enough to re-arm after revoke.

---

## Implementation sketch (post-unpause only)
1. Slack listener on designated venue for Claude Tag APPROVE marker.
2. Parse bound draft → normalize text → idempotency check.
3. Publish via signed-in box browser to `x.com` as `@Abdur_sayeed` **or** sanctioned X API if founder later adds Doppler path with Claude (no credential pooling in chat).
4. Write receipt under `northsun-ops/receipts/x-publish/`.
5. Thread ack. On failure follow `next_consequence`.

---

## Out of scope / non-goals
- Autonomous drafting (Agora/Claude write; this ADR is execute-only).
- Northsun X account.
- Replacing Claude Tag pull-only limits (still no unsolicited Claude queue-watch unless org owner grants schedule access separately).
- Lifting Orbit’s ban on merge/GitHub publish.

---

## Decision log
- **2026-09-25:** Orbit DRAFT filed from founder voice ask. Session verify: signed-in `@Abdur_sayeed`, Premium+ Active complimentary SuperGrok Heavy. Awaiting founder accept + Unpause before any routine.
- **2026-09-25 ~8:34 PM ET:** Added **Evidence Gate** section — Claude Code execution-boundary falsifier (Slack approval artifact required in every publish prompt).

