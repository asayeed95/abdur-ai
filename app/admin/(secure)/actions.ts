"use server";

import { revalidatePath } from "next/cache";
import { parseSaveRequest } from "@/lib/admin/draft-request";
import { requireAdmin } from "@/lib/admin/supabase";
import { configFromEnv, DraftError, Publisher, validateDraft, type DraftInput } from "@/lib/publish";

export type SaveResult =
  | { ok: true; dryRun: boolean; branch: string; prUrl?: string; note?: string }
  | { ok: false; problems: string[] };

/**
 * Save a draft through the same publish core as the MCP server: a commit on
 * drafts/<slug> + a draft PR. Never publishes. The admin check is repeated
 * here because a server action is a public POST endpoint.
 */
export async function saveDraft(rawInput: DraftInput, rawMode: "create" | "update", rawTaskId: string): Promise<SaveResult> {
  await requireAdmin();
  const req = parseSaveRequest({ input: rawInput, mode: rawMode, taskId: rawTaskId });
  if (!req.ok) return { ok: false, problems: req.problems };
  const { input, mode, taskId } = req.data;
  const problems = validateDraft(input);
  if (problems.length) return { ok: false, problems };
  try {
    const p = new Publisher(configFromEnv());
    const r = mode === "create" ? await p.createDraft(input, { taskId }) : await p.updateDraft(input.slug, input, { taskId });
    return r.dryRun
      ? { ok: true, dryRun: true, branch: r.branch, note: r.note }
      : { ok: true, dryRun: false, branch: r.branch, prUrl: r.pr.url };
  } catch (e) {
    return { ok: false, problems: e instanceof DraftError ? e.problems : [e instanceof Error ? e.message : String(e)] };
  }
}

/** Hide / unhide a comment. RLS + the update guard allow status only. */
export async function setCommentStatus(id: string, status: "visible" | "hidden"): Promise<{ ok: boolean; error?: string }> {
  const { sb } = await requireAdmin();
  if (status !== "visible" && status !== "hidden") return { ok: false, error: "status must be visible or hidden" };
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { ok: false, error: "not a comment id" };
  }
  const { error, count } = await sb.from("comments").update({ status }, { count: "exact" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: "No row changed — is this account in public.admins?" };
  revalidatePath("/admin/comments");
  return { ok: true };
}
