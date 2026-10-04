import { z } from "zod";

// Server actions are public POST endpoints and types vanish at runtime, so
// the request shape is checked here before the content rules in validateDraft.
const DraftShape = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  register: z.string(),
  body: z.string(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  tags: z.array(z.string()).optional(),
  receipts: z
    .array(z.object({ path: z.string(), sha: z.string().optional(), lines: z.string().optional(), note: z.string().optional() }))
    .optional(),
  status_note: z.string().optional(),
  seo_title: z.string().optional(),
  tldr: z.string().optional(),
  series: z.string().optional(),
  related: z.array(z.string()).optional(),
  comments: z.boolean().optional(),
});
export const SaveRequest = z.object({
  input: DraftShape,
  mode: z.enum(["create", "update"]),
  taskId: z.string().trim().regex(/^[A-Z]+-\d+$/, "Linear issue id (e.g. AGE-1234) is required"),
});

export type SaveRequestData = z.infer<typeof SaveRequest>;

/** The saveDraft request, shape-checked; problems name the failing field. */
export function parseSaveRequest(raw: unknown): { ok: true; data: SaveRequestData } | { ok: false; problems: string[] } {
  const r = SaveRequest.safeParse(raw);
  return r.success
    ? { ok: true, data: r.data }
    : { ok: false, problems: r.error.issues.map((i) => `${i.path.join(".") || "request"}: ${i.message}`) };
}
