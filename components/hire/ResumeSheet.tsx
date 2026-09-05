/**
 * The résumé sheet — a US-Letter page rendered in the browser.
 *
 * This is the one component on the site that sits OUTSIDE the Clay palette,
 * deliberately: it is a printed page, and it reads as paper in both themes.
 * The literals are written as Tailwind arbitrary values so they stay greppable
 * and stay scoped here — they are not tokens and must never leak into the site
 * theme.
 *
 *   #FBF7EF paper · #E8DECC rules · #1F1A14 ink · #464036 ink-soft
 *   #7E766A ink-muted · #B4563A paper-clay · #D97757 accent
 *
 * Sway/peel animation lives in the route-scoped <style> in app/hire/page.tsx,
 * so tailwind.config.ts needs no new keyframes.
 */

const EXPERIENCE = [
  {
    title: "Applied AI Products",
    dates: "Sep 2025 – Present",
    bullets: [
      "Lead governed-context product strategy, workflow and interface design, system decisions, and implementation on Northsun.",
      "Build HeyCLI — voice-oriented multi-session coding-agent orchestration; iOS-first client, authenticated WebSocket, Node/TS bridge.",
      "Design BrowseFlow's agent-agnostic browser automation and shape Dockerfile.ai's container-workflow intelligence.",
    ],
  },
  {
    title: "Enterprise Retail IT Delivery",
    dates: "Apr 2024 – Jul 2025",
    bullets: [
      "Retail IT subcontract for Vox Elements supporting ETRO Fashion US — 200+ users, 14 sites, 500+ tracked assets.",
      "Identity and endpoint policy across Active Directory, Entra ID, and Intune; Lansweeper, Cisco/RingCentral, Jira triage, cross-site escalation.",
    ],
  },
  {
    title: "Automotive Business Systems & Growth",
    dates: "2020 – 2024",
    bullets: [
      "Built and operated the business and technology foundations for three automotive-service businesses through their growth stages.",
      "QuickBooks, Excel, and Power BI reporting for pricing, profitability, and cash flow; reconciliation automated with Python and SQL.",
    ],
  },
];

const SHIPPED = [
  {
    name: "Northsun",
    // Verbatim claims_policy.IDENTITY — do not paraphrase.
    body: "Northsun is the memory and enrichment layer for AI agents. Gate-first governance; bi-temporal evidence on every fact.",
  },
  {
    name: "HeyCLI",
    body: "Voice multi-session orchestrator routing work to coding agents via a Node/TS bridge and iOS client.",
  },
  {
    name: "BrowseFlow",
    body: "Agent-agnostic browser automation — accessibility-tree perception, approval queues, run evidence.",
  },
  {
    name: "Dockerfile.ai",
    body: "Dockerfile generation, explanation, and optimization — verified in a sandbox before you trust it.",
  },
];

const SKILLS = [
  ["Applied AI —", "AI system design, prompt engineering, agent orchestration, workflow & tool design, browser automation, AI-assisted development"],
  ["Client delivery —", "customer discovery, requirements translation, technical delivery, product judgment, operator empathy"],
  ["Engineering —", "TypeScript, React/Next.js, Node.js, Python, SQL, Git, API integration, UX/product design"],
  ["Operations —", "Microsoft 365, Active Directory, Entra ID, Intune, Jira SM, Power BI"],
];

const QR_PATH =
  "M0 0.5h7m2 0h4m3 0h1m1 0h7M0 1.5h1m5 0h1m2 0h3m1 0h1m1 0h2m1 0h1m5 0h1M0 2.5h1m1 0h3m1 0h1m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1M0 3.5h1m1 0h3m1 0h1m1 0h1m2 0h1m1 0h2m3 0h1m1 0h3m1 0h1M0 4.5h1m1 0h3m1 0h1m1 0h2m8 0h1m1 0h3m1 0h1M0 5.5h1m5 0h1m1 0h2m2 0h1m2 0h2m1 0h1m5 0h1M0 6.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M8 7.5h2m2 0h1m1 0h2M0 8.5h1m1 0h5m3 0h1m1 0h3m3 0h5M0 9.5h2m6 0h3m1 0h1m1 0h1m1 0h1m2 0h1m3 0h1M1 10.5h2m1 0h1m1 0h2m1 0h1m2 0h2m1 0h2m1 0h2m1 0h1m1 0h2M4 11.5h1m5 0h3m2 0h1m8 0h1M1 12.5h1m2 0h1m1 0h2m4 0h4m1 0h2m1 0h1m1 0h3M0 13.5h4m1 0h1m1 0h1m1 0h2m5 0h1m2 0h1m1 0h1m1 0h1M0 14.5h1m1 0h3m1 0h1m1 0h1m2 0h2m1 0h2m1 0h5m1 0h2M0 15.5h1m1 0h4m2 0h1m2 0h1m2 0h1m1 0h1m1 0h3m3 0h1M0 16.5h1m1 0h2m1 0h2m4 0h1m1 0h2m1 0h5m1 0h1M8 17.5h3m1 0h1m2 0h2m3 0h2M0 18.5h7m7 0h1m1 0h1m1 0h1m1 0h1m1 0h3M0 19.5h1m5 0h1m1 0h1m3 0h1m1 0h3m3 0h2m1 0h1M0 20.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h9m1 0h3M0 21.5h1m1 0h3m1 0h1m1 0h2m4 0h5m1 0h5M0 22.5h1m1 0h3m1 0h1m1 0h1m2 0h3m1 0h1m1 0h1m3 0h2m1 0h1M0 23.5h1m5 0h1m3 0h2m4 0h6m2 0h1M0 24.5h7m1 0h1m1 0h3m4 0h8";

const RULE = "font-mono text-[10px] tracking-[0.22em] uppercase text-[#B4563A] border-b border-[#E8DECC] pb-1.5";

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-[#D97757] flex-none" aria-hidden>
        ·
      </span>
      <span>{children}</span>
    </li>
  );
}

export function ResumeSheet() {
  return (
    <section
      id="sheet"
      className="bg-bg-2 border-y border-border py-12 md:py-16 flex flex-col items-center gap-4 px-3 md:px-6"
    >
      <p className="font-mono text-[10px] tracking-widest uppercase text-muted-3">
        abdur.ai/hire · US Letter · one page
      </p>

      <div className="hire-sheet relative w-full md:w-[816px] md:min-h-[1056px] bg-[#FBF7EF] text-[#1F1A14] p-5 md:px-12 md:py-10 box-border flex flex-col gap-3.5">
        <div aria-hidden className="hire-peel hidden md:block absolute right-0 bottom-0 w-[46px] h-[46px] origin-bottom-right">
          <div
            className="absolute inset-0"
            style={{ background: "var(--hire-peel-bg)", clipPath: "polygon(100% 0,100% 100%,0 100%)" }}
          />
          <div className="absolute inset-0" style={{ filter: "drop-shadow(2px 2px 2px var(--hire-peel-shadow))" }}>
            <div
              className="absolute inset-0"
              style={{ background: "var(--hire-peel-paper)", clipPath: "polygon(0 0,100% 0,0 100%)" }}
            />
          </div>
        </div>

        {/* Masthead */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-5 md:gap-6">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#B4563A] mb-2">
              Applied AI Engineer · Client Delivery &amp; AI Workflow Architecture
            </p>
            <h2 className="font-display font-extrabold text-[30px] md:text-[38px] leading-none tracking-tight text-[#1F1A14]">
              Abdur Rahman M. Sayeed
            </h2>
            <div className="w-12 h-0.5 bg-[#D97757] my-2.5" />
            <p className="font-mono text-[10.5px] leading-[1.65] text-[#464036]">
              Prospect Park, NJ · (201) 321-2235 · asayeed95@outlook.com
              <br />
              linkedin.com/in/asayeed95 · github.com/asayeed95 ·{" "}
              <span className="text-[#B4563A]">portfolio &amp; hiring profile: abdur.ai/hire</span>
              <br />
              U.S. work authorized · no sponsorship required · remote / NJ·NYC / relocation
            </p>
          </div>
          <div className="text-center flex-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 25 25"
              shapeRendering="crispEdges"
              className="w-[84px] h-[84px] block"
              role="img"
              aria-label="QR code to abdur.ai/hire"
            >
              <path stroke="#1C1813" d={QR_PATH} />
            </svg>
            <p className="font-mono text-[9px] tracking-wider uppercase text-[#7E766A] mt-1.5">abdur.ai/hire</p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-[#464036] text-pretty">
          Applied AI engineer and client-delivery systems builder. I enter real businesses, learn the
          operator constraints, and build the systems underneath them — agent orchestration, prompt and
          system design, browser automation, and AI-assisted development, on a practical enterprise-IT
          foundation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_252px] gap-6 md:gap-8 flex-1">
          <div className="flex flex-col gap-3">
            <p className={RULE}>/// Experience</p>
            <div>
              <div className="flex justify-between items-baseline gap-3">
                <h3 className="font-display text-[16.5px] text-[#1F1A14]">
                  Forward Deployed Engineer · IT &amp; Business Systems Lead
                </h3>
                <span className="font-mono text-[9.5px] text-[#7E766A] whitespace-nowrap">2020 – Present</span>
              </div>
              <p className="font-mono text-[10px] text-[#B4563A] mt-0.5 mb-1">
                One Asec LLC · Prospect Park, NJ / Remote
              </p>
              <p className="text-[11.5px] leading-snug text-[#7E766A] mb-2.5">
                Client engagements below are delivery phases, most recent first.
              </p>
              <div className="flex flex-col gap-2.5">
                {EXPERIENCE.map((role) => (
                  <div key={role.title} className="border-l-2 border-[#E8DECC] pl-3">
                    <div className="flex justify-between items-baseline gap-3 mb-1.5">
                      <p className="text-[12.5px] font-semibold text-[#1F1A14]">{role.title}</p>
                      <span className="font-mono text-[9.5px] text-[#7E766A] whitespace-nowrap">{role.dates}</span>
                    </div>
                    <ul className="flex flex-col gap-1.5 text-[12.5px] leading-snug text-[#464036]">
                      {role.bullets.map((b) => (
                        <Bullet key={b}>{b}</Bullet>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={`${RULE} mb-2`}>/// Earlier experience</p>
              <div className="flex justify-between items-baseline gap-3">
                <h3 className="font-display text-[16.5px] text-[#1F1A14]">
                  Financial Operations &amp; IT Specialist
                </h3>
                <span className="font-mono text-[9.5px] text-[#7E766A] whitespace-nowrap">Jan 2019 – Jan 2020</span>
              </div>
              <p className="font-mono text-[10px] text-[#B4563A] mt-0.5 mb-2">Vital Life · Ottawa, ON</p>
              <div className="flex gap-2 text-[12.5px] leading-snug text-[#464036]">
                <span className="text-[#D97757] flex-none" aria-hidden>
                  ·
                </span>
                <span>
                  Owned bookkeeping, budgeting, KPI, CRM, invoicing, and monthly reporting while expanding
                  the company&apos;s marketing and IT foundation.
                </span>
              </div>
            </div>

            <div className="mt-auto">
              <p className={RULE}>/// Education &amp; Certification</p>
              <p className="text-[12.5px] leading-relaxed text-[#464036] mt-2">
                University of Ottawa — B.S., Financial Mathematics &amp; Economics (2015–2019) · Coding Dojo /
                Colorado Technical University — Cybersecurity Certificate, 24-week intensive (2023–2024) ·
                CompTIA Security+ (2024)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className={RULE}>/// Selected systems</p>
            <div className="flex flex-col gap-3">
              {SHIPPED.map((s) => (
                <div key={s.name} className="border border-[#E8DECC] rounded p-3">
                  <p className="font-display text-[14.5px] text-[#1F1A14]">{s.name}</p>
                  <p className="text-[11.5px] leading-snug text-[#464036] mt-1">{s.body}</p>
                </div>
              ))}
            </div>
            <p className={RULE}>/// Core skills</p>
            <div className="flex flex-col gap-2.5 text-[11.5px] leading-snug text-[#464036]">
              {SKILLS.map(([label, body]) => (
                <p key={label}>
                  <span className="font-semibold text-[#1F1A14]">{label}</span> {body}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
