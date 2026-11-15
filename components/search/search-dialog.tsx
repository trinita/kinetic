"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchDocType, SearchResult } from "@/lib/search/core";
import type { Locale } from "@/lib/i18n/routing";
import { fill } from "@/lib/format";
import { ResultContent } from "./result-item";

type Labels = {
  label: string;
  placeholder: string;
  open: string;
  close: string;
  loading: string;
  empty: string;
  hint: string;
  seeAll: string;
  types: Record<SearchDocType, string>;
};

/**
 * Header search button + dialog (⌘K / Ctrl+K or "/" to open).
 * Without JavaScript the button is a plain link to the search page.
 */
export function SearchDialog({
  locale,
  labels,
  searchPage,
}: {
  locale: Locale;
  labels: Labels;
  searchPage: string;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState("");
  const listId = useId();

  const open = useCallback(() => {
    dialogRef.current?.showModal();
    inputRef.current?.select();
  }, []);
  const close = () => dialogRef.current?.close();

  // Keyboard shortcuts: ⌘K / Ctrl+K anywhere, "/" when not typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement && e.target.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Debounced search as you type.
  useEffect(() => {
    const q = query.trim();
    // Empty box: nothing to fetch; the list is hidden while the query is empty.
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?lang=${locale}&q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results);
        setActive(0);
        setSearched(q);
      } catch {
        // Aborted (user kept typing) or offline: keep the previous results.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  const go = (url: string) => {
    close();
    router.push(url);
  };
  const visible = query.trim() ? results : [];
  const allResultsUrl = `${searchPage}?q=${encodeURIComponent(query.trim())}`;

  return (
    <>
      <a
        href={searchPage}
        onClick={(e) => {
          e.preventDefault();
          open();
        }}
        aria-label={labels.label}
        className="border-border text-muted hover:text-fg flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition"
      >
        <SearchIcon className="size-4" />
        <span className="hidden xl:inline">{labels.open}</span>
        <kbd className="border-border hidden rounded border px-1.5 font-sans text-xs xl:inline">⌘K</kbd>
      </a>

      <dialog
        ref={dialogRef}
        aria-label={labels.label}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="bg-surface text-fg border-border m-auto mt-[10vh] w-[min(40rem,calc(100vw-2rem))] max-w-none rounded-3xl border p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const target = visible[active];
            go(target ? target.url : allResultsUrl);
          }}
          className="border-border flex items-center gap-3 border-b px-5"
        >
          <SearchIcon className="text-muted size-5 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-label={labels.label}
            aria-expanded={visible.length > 0}
            aria-controls={listId}
            aria-activedescendant={visible[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder={labels.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, visible.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              }
            }}
            className="placeholder:text-muted h-16 flex-1 bg-transparent text-lg outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="button" onClick={close} className="text-muted hover:text-fg text-sm font-semibold">
            {labels.close}
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
          {!query.trim() && <p className="text-muted px-4 py-6 text-sm">{labels.hint}</p>}
          {query.trim() && loading && !visible.length && (
            <p className="text-muted px-4 py-6 text-sm">{labels.loading}</p>
          )}
          {query.trim() && !loading && searched && !visible.length && (
            <p className="text-muted px-4 py-6 text-sm">{fill(labels.empty, { q: searched })}</p>
          )}
          {visible.length > 0 && (
            <ul id={listId} role="listbox" aria-label={labels.label}>
              {visible.map((r, i) => (
                <li
                  key={r.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(r.url)}
                  className="aria-selected:bg-bg cursor-pointer rounded-2xl px-3 py-3"
                >
                  <ResultContent result={r} typeLabel={labels.types[r.type]} />
                </li>
              ))}
            </ul>
          )}
        </div>
        {visible.length > 0 && (
          <div className="border-border border-t px-5 py-3 text-right">
            <a
              href={allResultsUrl}
              onClick={(e) => {
                e.preventDefault();
                go(allResultsUrl);
              }}
              className="text-accent text-sm font-semibold underline underline-offset-4"
            >
              {labels.seeAll} →
            </a>
          </div>
        )}
      </dialog>
    </>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
