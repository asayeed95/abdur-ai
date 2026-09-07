import { REGISTER_SPEC, type Register } from "@/lib/registers";

/**
 * The register badge — index rows and the post header.
 *
 * `reported` gets clay (the register that owes receipts); `designed` and
 * `argued` sit in the muted scale. No new palette entries: this is the
 * existing mono-chrome convention, same as the eyebrow and status pills.
 */
export function RegisterBadge({
  register,
  className = "",
}: {
  register: Register;
  className?: string;
}) {
  const spec = REGISTER_SPEC[register];
  const tone =
    register === "reported"
      ? "text-clay border-clay/40"
      : "text-muted-2 border-border";
  return (
    <span
      title={spec.claim}
      className={`inline-block font-mono text-[10px] tracking-widest uppercase border px-2 py-0.5 rounded-sm ${tone} ${className}`}
    >
      {spec.label}
    </span>
  );
}

/**
 * The one-line status note that `designed` and `argued` posts carry near the
 * top. This is a credibility feature, not a disclaimer — it says the author
 * knows the difference between a thing built and a thing argued. It is
 * therefore styled as a statement (clay rule, mono, same weight as a receipt),
 * not as fine print.
 */
export function RegisterNote({
  register,
  note,
}: {
  register: Register;
  note?: string;
}) {
  if (!note) return null;
  return (
    <p
      className="not-prose font-mono text-xs tracking-wide text-muted border-l-2 border-clay pl-4 py-1 my-8"
      data-register={register}
    >
      {note}
    </p>
  );
}
