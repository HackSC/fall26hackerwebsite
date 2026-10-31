/**
 * Only allow same-origin relative redirects. Blocks absolute URLs, `//evil.com`,
 * and anything with `\` (browsers read `/\evil.com` as `//evil.com`).
 */
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

/** First value of a search param, or "" if missing. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
