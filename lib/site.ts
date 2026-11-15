export const site = {
  name: "Kinetic",
  /** WhatsApp number in wa.me format: country code, no "+", spaces or dashes. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281399325549",
  /** Shown in the footer as "+62 813-9932-5549". */
  whatsappDisplay: "+62 813-9932-5549",
} as const;

/** Click-to-chat link that opens WhatsApp with `message` already typed. */
export function whatsappLink(message?: string, number: string = site.whatsappNumber): string {
  const url = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
