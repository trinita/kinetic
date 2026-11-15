/** Marks draft content (only visible in development). */
export function DraftBadge({ label }: { label: string }) {
  return (
    <span className="border-jati text-jati inline-block rounded-full border border-dashed px-2.5 py-0.5 text-xs font-semibold">
      {label}
    </span>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-surface border-border text-muted inline-block rounded-full border px-3 py-1 text-xs font-semibold">
      {children}
    </span>
  );
}
