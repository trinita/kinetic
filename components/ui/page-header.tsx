import { DraftBadge } from "./badges";

export function PageHeader({
  title,
  intro,
  draftLabel,
  children,
}: {
  title: string;
  intro?: string;
  /** Shows a draft badge when set. */
  draftLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 md:pt-20">
      {draftLabel && <DraftBadge label={draftLabel} />}
      <h1 className="font-display text-accent-strong mt-2 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
        {title}
      </h1>
      {intro && <p className="text-muted mt-4 max-w-2xl text-lg leading-relaxed">{intro}</p>}
      {children}
    </header>
  );
}

export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-6xl px-4 pb-16 sm:px-6 ${className}`}>{children}</section>;
}

/** Friendly message for an empty list, with links to WhatsApp / Instagram. */
export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="border-border bg-surface rounded-3xl border border-dashed p-10 text-center">
      <p className="text-muted mx-auto max-w-lg text-lg">{message}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

export function NotTranslatedNotice({ text }: { text: string }) {
  return (
    <p className="border-border bg-surface text-muted mx-auto mb-6 max-w-6xl rounded-xl border px-4 py-3 text-sm sm:mx-6 lg:mx-auto">
      {text}
    </p>
  );
}
