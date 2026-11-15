/* eslint-disable @next/next/no-img-element -- tiny thumbnails; also rendered inside a client component */
import type { SearchResult } from "@/lib/search/core";

/** One search result: thumbnail, type, title and snippet. Shared by the dialog and the results page. */
export function ResultContent({ result, typeLabel }: { result: SearchResult; typeLabel: string }) {
  return (
    <span className="flex items-start gap-4">
      <span className="bg-walnut relative block size-14 shrink-0 overflow-hidden rounded-xl">
        {result.image ? (
          <img
            src={result.image.src}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <img
            src="/brand/kinetic-icon-dark.svg"
            alt=""
            className="absolute inset-2 size-10 object-contain"
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="text-accent block text-xs font-bold tracking-[0.15em] uppercase">{typeLabel}</span>
        <span className="font-display text-accent-strong block text-lg leading-snug font-semibold">
          {result.title}
        </span>
        <span className="text-muted mt-0.5 line-clamp-2 block text-sm">{result.snippet}</span>
      </span>
    </span>
  );
}
