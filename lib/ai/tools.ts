// Tools the assistant can use. Inputs come from the model, so every one is validated here.

import { z } from "zod";
import type { Locale } from "@/lib/i18n/routing";
import { buildDocuments } from "@/lib/search/documents";
import { search } from "@/lib/search";
import { whatsappLink } from "@/lib/site";
import type { ToolDef, ToolOutput } from "./types";

const inputs = {
  search_site: z.object({ query: z.string().min(1).max(200) }).strict(),
  get_page: z.object({ url: z.string().min(1).max(300) }).strict(),
  prepare_whatsapp_enquiry: z.object({ message: z.string().min(1).max(1000) }).strict(),
};

export const toolDefs: ToolDef[] = [
  {
    name: "search_site",
    description:
      "Search the Kinetic website (products, services, projects, articles, workshop info). " +
      "Use it before answering any question about products, materials, sizes, prices or services. " +
      "Returns titles, page URLs and short excerpts.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Search words, in the visitor's language." } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_page",
    description:
      "Get the full text of one page found with search_site, when the excerpt is not enough to answer.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "A URL exactly as returned by search_site." } },
      required: ["url"],
      additionalProperties: false,
    },
  },
  {
    name: "prepare_whatsapp_enquiry",
    description:
      "Prepare a WhatsApp message to the workshop for an order, custom request, price or anything the " +
      "website cannot answer. The visitor sees a button and sends the message themselves. " +
      "Write the message in the visitor's language, first person, summarising what they want " +
      "(product, size, wood, colour, timing) in 1–4 short sentences.",
    inputSchema: {
      type: "object",
      properties: { message: { type: "string", description: "The WhatsApp message text." } },
      required: ["message"],
      additionalProperties: false,
    },
  },
];

export function createToolRunner(locale: Locale) {
  // Built lazily, once per request.
  let pages: Map<string, { title: string; text: string }> | undefined;
  const pageIndex = () =>
    (pages ??= new Map(buildDocuments(locale).map((d) => [d.url, { title: d.title, text: d.text }])));

  return async function runTool(name: string, rawInput: unknown): Promise<ToolOutput> {
    switch (name) {
      case "search_site": {
        const input = inputs.search_site.safeParse(rawInput);
        if (!input.success) return invalid(input.error);
        const results = await search(locale, input.data.query, 6);
        if (!results.length) return { content: "No matching pages." };
        return {
          content: results.map((r) => `- ${r.title} (${r.type}) — ${r.url}\n  ${r.snippet}`).join("\n"),
        };
      }
      case "get_page": {
        const input = inputs.get_page.safeParse(rawInput);
        if (!input.success) return invalid(input.error);
        const page = pageIndex().get(input.data.url);
        if (!page)
          return { content: "No page with that URL. Use a URL returned by search_site.", isError: true };
        return { content: `# ${page.title}\n${page.text}`.slice(0, 8000) };
      }
      case "prepare_whatsapp_enquiry": {
        const input = inputs.prepare_whatsapp_enquiry.safeParse(rawInput);
        if (!input.success) return invalid(input.error);
        const url = whatsappLink(input.data.message);
        return {
          content:
            "Done. The visitor now sees a 'Continue on WhatsApp' button with this message. Tell them briefly.",
          event: { type: "whatsapp", url, message: input.data.message },
        };
      }
      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  };
}

function invalid(error: z.ZodError): ToolOutput {
  return {
    content: `Invalid input: ${error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ")}`,
    isError: true,
  };
}
