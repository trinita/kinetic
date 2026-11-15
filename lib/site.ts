export const site = {
  name: "Kinetic",
  /** WhatsApp number in wa.me format: country code, no "+", spaces or dashes. */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "6281399325549",
  /** Shown in the footer as "+62 813-9932-5549". */
  whatsappDisplay: "+62 813-9932-5549",
  address: {
    street: "Jl. Wibawa Mukti II No.39, RT.001/RW.004",
    area: "Jatiluhur, Kec. Jatiasih",
    city: "Kota Bekasi, Jawa Barat 17425",
  },
  instagram: { handle: "@_woodknots", url: "https://www.instagram.com/_woodknots/" },
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Jl. Wibawa Mukti II No.39, Jatiluhur, Jatiasih, Kota Bekasi, Jawa Barat 17425"),
} as const;

/** Click-to-chat link that opens WhatsApp with `message` already typed. */
export function whatsappLink(message?: string, number: string = site.whatsappNumber): string {
  const url = `https://wa.me/${number.replace(/\D/g, "")}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
