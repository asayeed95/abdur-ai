"use client";

import { useMemo, useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { saveDraft, type SaveResult } from "../actions";
import type { DraftInput, Receipt } from "@/lib/publish/draft";

const REGISTERS = [
  { value: "reported", hint: "This happened — needs receipts" },
  { value: "designed", hint: "How I would build it" },
  { value: "argued", hint: "What I think is true" },
] as const;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

/** "path@sha lines — note" per line ⇄ receipts[] */
const parseReceipts = (t: string): Receipt[] =>
  t
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [head, note] = l.split(/\s+—\s+/, 2);
      const [pathPart, rest] = head.split("@");
      const [sha, lines] = (rest ?? "").split(/\s+/);
      return { path: pathPart.trim(), ...(sha ? { sha } : {}), ...(lines ? { lines } : {}), ...(note ? { note } : {}) };
    });
const formatReceipts = (r: Receipt[] = []) =>
  r.map((x) => `${x.path}${x.sha ? `@${x.sha}` : ""}${x.lines ? ` ${x.lines}` : ""}${x.note ? ` — ${x.note}` : ""}`).join("\n");

/**
 * Draft editor. Saves through the publish core (commit on drafts/<slug> +
 * draft PR). There is deliberately no "Publish now": publishing is the PR
 * merge with a human-quoted override entry.
 */
export function Editor({ initial, mode }: { initial?: DraftInput; mode: "create" | "update" }) {
  const [d, setD] = useState<DraftInput>(
    initial ?? { slug: "", title: "", description: "", register: "argued", body: "", tags: [] },
  );
  const [slugTouched, setSlugTouched] = useState(mode === "update");
  const [receipts, setReceipts] = useState(formatReceipts(initial?.receipts));
  const [taskId, setTaskId] = useState("");
  const [result, setResult] = useState<SaveResult | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof DraftInput>(k: K, v: DraftInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const preview = useMemo(() => d.body.replace(/<[A-Z][^>]*\/>/g, "*[component]*"), [d.body]);

  const field = "w-full bg-surface border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-clay";
  const label = "block font-mono text-[10px] tracking-widest uppercase text-meta mb-1.5";

  return (
    <form
      className="grid lg:grid-cols-2 gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        const input: DraftInput = { ...d, receipts: parseReceipts(receipts) };
        start(async () => setResult(await saveDraft(input, mode, taskId.trim())));
      }}
    >
      <div className="space-y-4">
        <div>
          <label className={label} htmlFor="title">Title</label>
          <input id="title" className={field} value={d.title} onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="slug">Slug</label>
            <input id="slug" className={field} value={d.slug} readOnly={mode === "update"} onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }} />
          </div>
          <div>
            <label className={label} htmlFor="register">Register</label>
            <select id="register" className={field} value={d.register} onChange={(e) => set("register", e.target.value)}>
              {REGISTERS.map((r) => (
                <option key={r.value} value={r.value}>{r.value} — {r.hint}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="subtitle">Subtitle (optional)</label>
          <input id="subtitle" className={field} value={d.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value || undefined)} />
        </div>
        <div>
          <label className={label} htmlFor="description">Description ({d.description.length}/160)</label>
          <textarea id="description" rows={2} className={field} value={d.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label} htmlFor="tags">Tags (comma-separated)</label>
            <input id="tags" className={field} value={(d.tags ?? []).join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className={label} htmlFor="task">Linear issue</label>
            <input id="task" className={field} placeholder="AGE-1234" value={taskId} onChange={(e) => setTaskId(e.target.value.toUpperCase())} />
          </div>
        </div>
        {d.register === "reported" && (
          <div>
            <label className={label} htmlFor="receipts">Receipts — one per line: path@sha L10-20 — note</label>
            <textarea id="receipts" rows={3} className={`${field} font-mono text-xs`} value={receipts} onChange={(e) => setReceipts(e.target.value)} />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={d.comments === true} onChange={(e) => set("comments", e.target.checked || undefined)} />
          Open reader comments on this post
        </label>
        <div>
          <label className={label} htmlFor="body">Body (MDX)</label>
          <textarea id="body" rows={22} className={`${field} font-mono text-xs leading-relaxed`} value={d.body} onChange={(e) => set("body", e.target.value)} />
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className="font-mono text-xs uppercase tracking-widest bg-clay text-bg px-5 py-3 rounded-sm cursor-pointer disabled:opacity-50">
            {pending ? "Saving…" : mode === "create" ? "Save draft → PR" : "Update draft"}
          </button>
          <span className="font-mono text-[11px] text-meta">Publishing = merging the PR.</span>
        </div>
        {result && (
          <div role="status" className="font-mono text-xs bg-surface border border-border rounded-sm p-4 space-y-1">
            {result.ok ? (
              result.dryRun ? (
                <p>Validated. Dry run, nothing written: {result.note}</p>
              ) : (
                <p>
                  Saved on <code>{result.branch}</code> ·{" "}
                  <a className="text-clay underline" href={result.prUrl} target="_blank" rel="noopener">open PR ↗</a>
                </p>
              )
            ) : (
              <ul className="text-clay list-disc pl-4">{result.problems.map((p) => <li key={p}>{p}</li>)}</ul>
            )}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-6 self-start">
        <p className={label}>Preview (markdown; components shown as placeholders)</p>
        <article className="bg-surface border border-border rounded-lg p-6 max-h-[80vh] overflow-auto">
          <h1 className="font-display text-3xl mb-2">{d.title || "Untitled"}</h1>
          {d.subtitle && <p className="font-display italic text-meta mb-4">{d.subtitle}</p>}
          <div className="prose-clay text-[15px] break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
          </div>
        </article>
      </div>
    </form>
  );
}
