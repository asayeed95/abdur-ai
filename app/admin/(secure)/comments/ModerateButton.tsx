"use client";

import { useState, useTransition } from "react";
import { setCommentStatus } from "../actions";

export function ModerateButton({ id, status }: { id: string; status: "visible" | "hidden" }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const next = status === "visible" ? "hidden" : "visible";
  return (
    <div className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => {
          const r = await setCommentStatus(id, next);
          setError(r.ok ? "" : r.error ?? "failed");
        })}
        className="font-mono text-[11px] uppercase tracking-widest border border-border px-3 py-1.5 rounded-sm hover:border-clay cursor-pointer disabled:opacity-50"
      >
        {pending ? "…" : status === "visible" ? "Hide" : "Unhide"}
      </button>
      {error && <p className="font-mono text-[10px] text-clay mt-1 max-w-[16rem]">{error}</p>}
    </div>
  );
}
