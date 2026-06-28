type Item = { id: string; name: string };

export function PatternsBlock({ items }: { items: Item[] }) {
  return (
    <aside className="not-prose my-12 bg-bg-2 border border-border rounded-lg p-6">
      <p className="font-mono text-[10px] tracking-widest uppercase text-clay mb-4">
        /// PATTERNS COMMITTED TO MOLL
      </p>
      <ul className="space-y-2 font-mono text-sm">
        {items.map((p) => (
          <li key={p.id} className="text-text-soft">
            <code className="text-clay">{p.id}</code>{" "}
            <span className="text-muted">— {p.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
