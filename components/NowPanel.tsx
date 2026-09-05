import { Reveal } from "./Reveal";
import { getNowState } from "@/lib/supabase";

/**
 * Live "Now" panel — agents currently running, last shipped, what's next.
 *
 * Async server component: reads the latest state from Supabase `now_state`
 * (via getNowState(), fetch-tagged 'now' so /api/ingest/now's
 * revalidateTag('now') refreshes it). Falls back to SEED_AGENTS when the
 * row is missing or Supabase is unreachable — never throws. An empty
 * agents list is truthful and renders as "none running", not as seed.
 */

type Agent = {
  agent: string;
  task: string;
  state: "running" | "queued" | "idle" | "done" | "blocked";
};

const STATE_COLOR: Record<Agent["state"], string> = {
  running: "text-good border-good-3 bg-good-3/30",
  queued: "text-gold border-border-2 bg-border-2/30",
  idle: "text-muted border-border bg-surface",
  done: "text-muted-3 border-border bg-surface",
  blocked: "text-clay border-clay/40 bg-clay/10",
};

const SEED_AGENTS: Agent[] = [
  { agent: "Opus", task: "spec'ing the Beacon push surface", state: "running" },
  { agent: "Claude Code", task: "hardening the gate-first memory write path", state: "running" },
  { agent: "Codex", task: "patching dockerfile.ai sandbox verification", state: "running" },
  { agent: "stress-harness", task: "voice recall p95 under real concurrency", state: "queued" },
];

export async function NowPanel() {
  const rows = await getNowState();
  // null = no row / Supabase unreachable → seed. [] = a real, truthful
  // "nothing running" state and must render as such, never as fake activity.
  const agents = rows ?? SEED_AGENTS;
  return (
    <Reveal as="section" className="border-y border-border bg-bg-2">
      <div className="max-w-content mx-auto px-6 md:px-10 py-14">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="eyebrow mb-2">/// NOW · live</p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight text-text">
              Agents at work.
            </h2>
          </div>
          <p className="hidden md:block font-mono text-xs text-muted-3">
            updated weekly · pushed by my agents
          </p>
        </div>

        <ul className="grid gap-3">
          {agents.length === 0 && (
            <p className="font-mono text-sm text-muted-3 py-6">No agents running right now.</p>
          )}
          {agents.map((a) => (
            <li
              key={a.agent + a.task}
              className="grid grid-cols-[120px_1fr_110px] md:grid-cols-[180px_1fr_140px] items-center gap-4 py-3 border-t border-border first:border-t-0"
            >
              <span className="font-mono text-sm text-text-soft truncate">
                {a.agent}
              </span>
              <span className="text-base text-text-soft leading-snug">
                {a.task}
              </span>
              <span
                className={`justify-self-end font-mono text-[10px] tracking-wider uppercase px-2 py-1 rounded-sm border ${STATE_COLOR[a.state]}`}
              >
                ● {a.state}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}
