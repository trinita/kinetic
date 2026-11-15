import Markdown from "react-markdown";

/** Renders Markdown from content/ files with the site's typography. */
export function Prose({ children, className = "" }: { children: string; className?: string }) {
  return (
    <div className={`text-fg max-w-prose text-lg leading-relaxed ${className}`}>
      <Markdown
        components={{
          h2: (p) => (
            <h2 className="font-display text-accent-strong mt-10 mb-3 text-2xl font-semibold" {...p} />
          ),
          h3: (p) => (
            <h3 className="font-display text-accent-strong mt-8 mb-2 text-xl font-semibold" {...p} />
          ),
          p: (p) => <p className="my-4" {...p} />,
          ul: (p) => <ul className="my-4 list-disc space-y-1 pl-6" {...p} />,
          ol: (p) => <ol className="my-4 list-decimal space-y-1 pl-6" {...p} />,
          a: (p) => <a className="text-accent underline underline-offset-4" {...p} />,
          strong: (p) => <strong className="font-semibold" {...p} />,
          blockquote: (p) => (
            <blockquote className="border-accent text-muted my-6 border-l-4 pl-4 italic" {...p} />
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
