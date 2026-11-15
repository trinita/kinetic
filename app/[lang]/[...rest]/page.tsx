import { notFound } from "next/navigation";

// Any URL that doesn't match a page renders the translated app/[lang]/not-found.tsx.
export default function CatchAll() {
  notFound();
}
