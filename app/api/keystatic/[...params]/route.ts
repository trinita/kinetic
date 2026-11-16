import { makeRouteHandler } from "@keystatic/next/route-handler";
import config from "../../../../keystatic.config";

// GitHub mode needs the GitHub App credentials (see content/README.md → "Admin setup").
// Until they are set, answer "not set up" instead of failing the whole site build.
const ready =
  config.storage.kind === "local" ||
  Boolean(
    process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
    process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
    process.env.KEYSTATIC_SECRET,
  );

const notReady = () =>
  new Response("The admin is not set up yet: the GitHub App credentials are missing.", { status: 503 });

const handlers = ready ? makeRouteHandler({ config }) : { GET: notReady, POST: notReady };

export const GET = handlers.GET;
export const POST = handlers.POST;
