type Item = { path: string; sha?: string; lines?: string; note?: string };

export function ReceiptsBlock({ items }: { items: Item[] }) {
  return (
    <aside className="not-prose my-12 bg-surface border border-border rounded-lg p-6">
      <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-4">
        /// RECEIPTS
      </p>
      <ul className="space-y-3 font-mono text-sm">
        {items.map((it, i) => (
          <li key={i} className="leading-relaxed text-text-soft">
            <code className="text-text bg-bg px-1.5 py-0.5 rounded border border-border">
              {it.path}
            </code>
            {it.lines && <span className="text-muted-3"> {it.lines}</span>}
            {it.sha && (
              <span className="text-muted-3"> @ </span>
            )}
            {it.sha && (
              <code className="text-clay">{it.sha}</code>
            )}
            {it.note && <p className="text-muted text-[13px] mt-1 ml-1">{it.note}</p>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
