import { site, whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "./icons";

const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition";
export const buttonStyles = {
  primary: `${base} bg-accent-strong text-on-accent-strong hover:opacity-90`,
  secondary: `${base} border-border bg-surface border hover:border-accent`,
};

/** Button that opens WhatsApp with `message` already typed. */
export function WhatsAppButton({
  message,
  children,
  variant = "primary",
  className = "",
}: {
  message?: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonStyles;
  className?: string;
}) {
  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${buttonStyles[variant]} ${className}`}
    >
      <WhatsAppIcon className="size-5" />
      {children}
    </a>
  );
}

export function InstagramLink({ children }: { children: React.ReactNode }) {
  return (
    <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className={buttonStyles.secondary}>
      {children}
    </a>
  );
}
