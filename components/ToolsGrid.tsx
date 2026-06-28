import Link from "next/link";
import { Reveal } from "./Reveal";

type Tool = {
  name: string;
  desc: string;
  status: "Live" | "Near-launch" | "TestFlight" | "Building";
  href: string;
  icon: React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    name: "Dockerfile.ai",
    desc: "Dockerfiles that actually build. Generates a multi-stage, security-aware build, then verifies it in a sandbox before you ever trust it.",
    status: "Live",
    href: "https://dockerfile.ai",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <rect x="6" y="10" width="20" height="16" fill="none" stroke="#D97757" strokeWidth="2.5" />
        <rect x="12" y="4" width="20" height="16" fill="none" stroke="#D97757" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    name: "Cuéntame",
    desc: "A Spanish–English tutor that calls you. Ten-minute outbound sessions that build the practice habit an app never could.",
    status: "Near-launch",
    href: "/tools/cuentame",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="13" fill="none" stroke="#D97757" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="4.5" fill="#D97757" />
      </svg>
    ),
  },
  {
    name: "HeyCLI",
    desc: "Voice and natural-language control for your terminal. An iOS companion plus a local daemon, talking over Tailscale.",
    status: "TestFlight",
    href: "/tools/heycli",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <rect x="5" y="7" width="26" height="22" rx="2" fill="none" stroke="#D97757" strokeWidth="2.5" />
        <path d="M11 15 L16 19 L11 23" fill="none" stroke="#D97757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="19" y1="23" x2="25" y2="23" stroke="#D97757" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Halo",
    desc: "Dispatch and ops software for limo and fleet operators. B2B, operator-first — built from real time behind the wheel.",
    status: "Building",
    href: "/tools/halo",
    icon: (
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <circle cx="18" cy="18" r="13" fill="none" stroke="#D97757" strokeWidth="2.5" />
        <circle cx="18" cy="18" r="6.5" fill="none" stroke="#D97757" strokeWidth="2.5" />
      </svg>
    ),
  },
];

const STATUS_CLASS: Record<Tool["status"], string> = {
  Live: "status-pill status-live",
  "Near-launch": "status-pill status-near",
  TestFlight: "status-pill status-flight",
  Building: "status-pill status-building",
};

export function ToolsGrid() {
  return (
    <Reveal
      as="section"
      id="tools"
      className="max-w-content mx-auto px-6 md:px-10 py-24"
    >
      <p className="eyebrow mb-4">/// THE STAND</p>
      <h2 className="font-display text-4xl md:text-6xl tracking-tight text-text mb-3">
        The stand
      </h2>
      <p className="text-muted text-lg max-w-[640px] mb-12">
        Where the portfolio stands today — Mnemix is the spine, these are the
        products on top.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((t) => (
          <Link
            key={t.name}
            href={t.href}
            className={`group bg-surface border border-border rounded-lg p-6 hover:border-clay transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-20px_rgba(217,119,87,0.5)] ${
              t.status === "Building" ? "opacity-80" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-5">
              <div>{t.icon}</div>
              <span className={STATUS_CLASS[t.status]}>{t.status}</span>
            </div>
            <h3 className="font-display text-xl text-text group-hover:text-clay transition-colors mb-2">
              {t.name}
            </h3>
            <p className="text-sm text-muted leading-relaxed">{t.desc}</p>
          </Link>
        ))}
      </div>
    </Reveal>
  );
}
