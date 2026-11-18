"use client";

import { useRef } from "react";

type Labels = { button: string; title: string; close: string };

/**
 * "Watch the workshop video" pill in the homepage hero. Opens a modal player;
 * the video only downloads when the visitor opens it (preload="none").
 */
export function WorkshopVideo({ labels }: { labels: Labels }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const open = () => {
    dialogRef.current?.showModal();
    void videoRef.current?.play().catch(() => {});
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="bg-walnut/85 text-krem hover:bg-walnut focus-visible:outline-accent mb-6 inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-2 text-sm font-medium backdrop-blur-sm transition"
      >
        <span
          aria-hidden="true"
          className="bg-krem text-walnut flex size-7 items-center justify-center rounded-full"
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 size-3.5" fill="currentColor">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        {labels.button}
      </button>

      <dialog
        ref={dialogRef}
        aria-label={labels.title}
        onClose={() => videoRef.current?.pause()}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="m-auto w-[min(60rem,calc(100vw-2rem))] max-w-none overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="mb-3 flex items-center justify-between gap-4 text-white">
          <p className="text-sm font-medium">{labels.title}</p>
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold hover:bg-white/25"
          >
            {labels.close}
          </button>
        </div>
        <video
          ref={videoRef}
          src="/videos/workshop.mp4"
          poster="/videos/workshop-poster.jpg"
          preload="none"
          controls
          playsInline
          muted
          className="aspect-video w-full rounded-2xl bg-black"
        />
      </dialog>
    </>
  );
}
