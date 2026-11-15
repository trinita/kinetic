"use client";

import { useState } from "react";
import { whatsappLink } from "@/lib/site";
import { fill } from "@/lib/format";
import { WhatsAppIcon } from "@/components/ui/icons";

type Labels = {
  name: string;
  interest: string;
  interestPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  send: string;
  note: string;
  template: string;
};

/** Builds a WhatsApp message from the form and opens WhatsApp. Nothing is sent to our server. */
export function EnquiryForm({ labels }: { labels: Labels }) {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("");
  const [message, setMessage] = useState("");

  const text = fill(labels.template, {
    name: name.trim(),
    interest: interest.trim(),
    message: message.trim(),
  }).trim();

  const field =
    "border-border bg-bg focus:border-accent mt-1 w-full rounded-xl border px-4 py-3 text-base outline-none transition";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
      }}
      className="space-y-4"
    >
      <label className="block">
        <span className="text-sm font-semibold">{labels.name}</span>
        <input
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">{labels.interest}</span>
        <input
          required
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          placeholder={labels.interestPlaceholder}
          className={field}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">{labels.message}</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={labels.messagePlaceholder}
          className={field}
        />
      </label>
      <button
        type="submit"
        className="bg-accent-strong text-on-accent-strong inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition hover:opacity-90"
      >
        <WhatsAppIcon className="size-5" />
        {labels.send}
      </button>
      <p className="text-muted text-sm">{labels.note}</p>
    </form>
  );
}
