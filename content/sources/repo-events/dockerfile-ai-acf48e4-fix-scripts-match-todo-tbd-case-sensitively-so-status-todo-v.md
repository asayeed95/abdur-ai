# dockerfile-ai acf48e4 — fix(scripts): match TODO/TBD case-sensitively so status:todo validates (#44)
**Receipts:** `git -C dockerfile-ai log -1 acf48e4` (merged to main) — Abdur Rahman, 2026-07-01

PROCESS.md Task Status Protocol sanctions bare `status: todo` as a valid
build-plan value, but three CI judges matched /TODO|...|TBD/i case-
INSENSITIVELY, flagging the lowercase status token as template boilerplate —
making the mandated vocabulary un-validatable the moment any row uses it.

Fix: match uppercase TODO/TBD case-sensitively (\bTODO\b / \bTBD\b); keep
the phrase markers (PROMPT TO FILL / placeholder / usually one task) case-
insensitive. Real template markers are always uppercase, so honesty
enforcement is unchanged — verified: lowercase `todo` no longer flagged,
uppercase `TODO` still caught; all three validators still green on main's
current build-plan.

Split out of the PLAN-CANON-001 spec PR (#43) to keep that PR lane-pure
(Architect = spec/* only); this is the DevOps prerequisite it depends on.


Claude-Session: https://claude.ai/code/session_018tA1Sbr2CabLZG6SeFWyEG

Co-authored-by: Claude Fable 5 <noreply@anthropic.com>

**Used by:** content/posts/_drafts/the-case-sensitive-todo-that-lied-about-status.mdx
