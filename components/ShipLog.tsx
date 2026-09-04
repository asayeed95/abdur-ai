import { Reveal } from "./Reveal";
import { getShipLog } from "@/lib/supabase";

/**
 * "Ship log" — terse, git-log style. Agent-pushable.
 * Async server component: reads Supabase `ship_log` (via getShipLog(),
 * fetch-tagged 'ship' so /api/ingest/ship's revalidateTag('ship') refreshes
 * it). Falls back to /content/ship-log.json when the table is empty or
 * Supabase is unreachable — never throws.
 */

import shipLogData from "@/content/ship-log.json";

export async function ShipLog() {
  const rows = await getShipLog();
  const entries = rows.length > 0
    ? rows
    : (shipLogData as Array<{ date: string; text: string; tag: string }>);
  return (
    <Reveal as="section" id="log" className="max-w-content mx-auto px-6 md:px-10 py-20">
      <div className="flex items-baseline justify-between mb-10 flex-wrap gap-2">
        <div>
          <p className="eyebrow mb-2">/// SHIP LOG</p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text">
            Ship log
          </h2>
        </div>
        <p className="font-mono text-xs text-muted-3">
          git log --oneline · pushed by my agents
        </p>
      </div>

      <ul className="font-mono text-sm space-y-0">
        {entries.map((e, i) => (
          <li
            key={i}
            className="grid grid-cols-[90px_1fr_auto] md:grid-cols-[110px_1fr_auto] gap-4 items-baseline py-3 border-b border-border hover:bg-surface px-3 -mx-3 transition-colors"
          >
            <span className="text-clay tracking-widest text-xs">{e.date}</span>
            <span className="text-text-soft leading-relaxed">{e.text}</span>
            <span className="text-muted-3 text-xs tracking-wider">#{e.tag}</span>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
