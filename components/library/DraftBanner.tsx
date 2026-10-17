/** Marks an unapproved asset on a preview build. Production never renders drafts. */
export function DraftBanner() {
  return (
    <p role="note" className="mb-8 font-mono text-[11px] tracking-widest uppercase text-clay border border-clay rounded-sm px-3 py-2 inline-block">
      Draft preview: not approved for publication
    </p>
  );
}
