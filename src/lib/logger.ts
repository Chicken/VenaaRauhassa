import { inspect } from "util";
import { env } from "~/lib/env";

export async function log(message: string) {
  if (!env.ERROR_WEBHOOK) return;
  await fetch(env.ERROR_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message,
    }),
    signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
  });
}

function camelToTitleCase(str: string) {
  return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

async function uploadError(str: string) {
  if (!env.ERROR_UPLOAD_URL) return "No error upload URL configured";
  const res = (await fetch(`${env.ERROR_UPLOAD_URL}/documents`, {
    method: "POST",
    body: str,
    signal: AbortSignal.timeout(env.REQUEST_TIMEOUT),
  })
    .then((res) => res.json())
    .catch((e) => {
      console.error(e);
      return { key: "-error-" };
    })) as { key: string };
  return `${env.ERROR_UPLOAD_URL}/${res.key}.js`;
}

export async function error(context: Record<string, string | undefined>, error?: unknown) {
  if (!env.ERROR_WEBHOOK) return;
  const errorString = error instanceof Error ? inspect(error, { depth: null }) : String(error);
  const errorUrl = error ? await uploadError(errorString) : null;
  const contextString = Object.entries(context)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${camelToTitleCase(key)}: ${value}`)
    .join("\n");
  await log(contextString + "\n" + (error ? "Error: " + errorUrl : ""));
}
