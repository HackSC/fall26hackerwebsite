/**
 * Only allow same-origin relative redirects. Blocks absolute URLs, `//evil.com`,
 * anything with `\` (browsers read `/\evil.com` as `//evil.com`) and control
 * characters (browsers strip tab/CR/LF, so `/\t/evil.com` becomes `//evil.com`).
 */
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x1f\x7f]/.test(value)) {
    return fallback;
  }
  return value;
}

/** First value of a search param, or "" if missing. */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * `value` if it is a plain file in this user's own folder of the public avatars
 * bucket, else null. Restricting the filename blocks `../`, `%2e%2e`, queries and fragments.
 */
export function ownAvatarUrl(value: string, supabaseUrl: string, userId: string): string | null {
  const prefix = `${supabaseUrl}/storage/v1/object/public/avatars/${userId}/`;
  return value.startsWith(prefix) && /^[\w-]+\.\w+$/.test(value.slice(prefix.length)) ? value : null;
}
