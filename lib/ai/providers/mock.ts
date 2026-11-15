// Scripted provider for tests and offline UI work (AI_PROVIDER=mock). Makes no network calls,
// but runs the real tools so search and the WhatsApp hand-off are exercised end to end.

import type { ProviderRun } from "../types";

export const runMock: ProviderRun = async function* ({ turns, runTool, locale }) {
  const question = turns.at(-1)?.content ?? "";
  const wantsOrder = /pesan|order|whatsapp|harga|price/i.test(question);

  if (wantsOrder) {
    const output = await runTool("prepare_whatsapp_enquiry", {
      message:
        locale === "id"
          ? `Halo Kinetic, saya ingin bertanya: ${question}`
          : `Hello Kinetic, I'd like to ask: ${question}`,
    });
    if (output.event) yield output.event;
    yield {
      type: "text",
      text: locale === "id" ? "Pesan WhatsApp sudah saya siapkan." : "I've prepared a WhatsApp message.",
    };
    return;
  }

  yield { type: "status", status: "searching" };
  const output = await runTool("search_site", { query: question });
  const first = output.content.match(/^- (.+?) \(\w+\) — (\S+)/m);
  const reply = first
    ? locale === "id"
      ? `Coba lihat [${first[1]}](${first[2]}).`
      : `Have a look at [${first[1]}](${first[2]}).`
    : locale === "id"
      ? "Maaf, saya tidak menemukan informasinya."
      : "Sorry, I couldn't find that.";
  for (const word of reply.split(/(?<= )/)) yield { type: "text", text: word };
};
