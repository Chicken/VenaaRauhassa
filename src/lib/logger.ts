import { inspect } from "util";
import { env } from "~/lib/env";

export async function log(message: string) {
  if (!env.ERROR_DISCORD_WEBHOOK) return;
  await fetch(env.ERROR_DISCORD_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
  });
}

function camelToTitleCase(str: string) {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

async function uploadToHastebin(str: string) {
  if (!env.ERROR_HASTEBIN_URL) return "No HasteBin URL configured";
  const res = await fetch(`${env.ERROR_HASTEBIN_URL}/documents`, {
    method: "POST",
    body: str,
  });
  const { key } = (await res.json()) as unknown as { key: string };
  return `${env.ERROR_HASTEBIN_URL}/${key}.js`;
}

export async function error(context: Record<string, string>, error: unknown) {
  if (!env.ERROR_DISCORD_WEBHOOK) return;
  const errorString = error instanceof Error ? inspect(error, { depth: null }) : String(error);
  const errorHaste = await uploadToHastebin(errorString);
  const contextString = Object.keys(context)
    .map((key) => `${camelToTitleCase(key)}: ${context[key]}`)
    .join("\n");
  await log(contextString + "\n" + "Error: " + errorHaste);
}
