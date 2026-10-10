"use client";

import { trackEvent } from "@/lib/analytics";
import { KIT_FILES, KIT_ZIP } from "@/lib/kit";

/**
 * The kit's download links. Plain anchors to static files in public/kit, so
 * they work with JS off; with JS on, a click also fires `kit:download` with a
 * coarse `file` key (never user input).
 */
export function KitDownloads() {
  return (
    <div>
      <a
        href={KIT_ZIP.href}
        download
        onClick={() => trackEvent("kit:download", { file: KIT_ZIP.key })}
        className="inline-block font-mono text-xs tracking-widest uppercase text-bg bg-clay px-5 py-3 rounded-sm hover:opacity-90 transition-opacity"
      >
        Download the kit ({KIT_ZIP.format}) →
      </a>
      <p className="mt-3 font-mono text-[11px] text-meta">{KIT_ZIP.summary}</p>

      <p className="mt-8 mb-3 font-mono text-[11px] tracking-widest uppercase text-meta">
        Or one file at a time
      </p>
      <ul className="divide-y divide-border border-y border-border">
        {KIT_FILES.map((f) => (
          <li key={f.href} className="py-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <a
              href={f.href}
              download
              onClick={() => trackEvent("kit:download", { file: f.key })}
              className="text-text underline decoration-border underline-offset-4 hover:text-clay hover:decoration-clay"
            >
              {f.title}
            </a>
            <span className="font-mono text-[11px] text-meta">{f.format}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
