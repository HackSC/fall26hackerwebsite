// Pure event-form helpers. No runtime imports so `node --test` can load it
// directly (see event-form.test.mjs).
import type { EventInsert, EventKind } from "./database.types";

// Mirrors EVENT_KIND_LABELS in constants.ts. Kept here to stay import-free.
const KINDS: readonly EventKind[] = ["event", "workshop", "meal", "treat", "deadline"];

type Parts = Record<"year" | "month" | "day" | "hour" | "minute" | "second", string>;

function zonedParts(ms: number, timeZone: string): Parts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(fmt.formatToParts(ms).map((p) => [p.type, p.value])) as Parts;
}

/** ISO instant → "YYYY-MM-DDTHH:mm" wall-clock time in `timeZone` (for datetime-local inputs). */
export function isoToZoned(iso: string, timeZone: string): string {
  const p = zonedParts(Date.parse(iso), timeZone);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** "YYYY-MM-DDTHH:mm" wall-clock time in `timeZone` → ISO instant, or null if invalid or nonexistent. */
export function zonedToIso(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  const offset = (ms: number) => {
    const p = zonedParts(ms, timeZone);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - ms;
  };
  // Second pass corrects the guess when it lands on the other side of a DST change.
  let ms = asUtc - offset(asUtc);
  ms = asUtc - offset(ms);
  // Round-trip check catches impossible dates (Feb 31) and DST-skipped times.
  return isoToZoned(new Date(ms).toISOString(), timeZone) === local ? new Date(ms).toISOString() : null;
}

export type EventFieldErrors = Partial<Record<"title" | "kind" | "starts_at" | "ends_at", string>>;

export type ParsedEvent = { ok: true; event: EventInsert } | { ok: false; errors: EventFieldErrors };

export function parseEventForm(fields: Record<string, unknown>, timeZone: string): ParsedEvent {
  const text = (k: string) => String(fields[k] ?? "").trim();
  const errors: EventFieldErrors = {};

  const title = text("title").slice(0, 200);
  const kind = text("kind") as EventKind;
  const starts_at = zonedToIso(text("starts_at"), timeZone);
  const endsInput = text("ends_at");
  const ends_at = endsInput ? zonedToIso(endsInput, timeZone) : null;

  if (!title) errors.title = "Title is required.";
  if (!KINDS.includes(kind)) errors.kind = "Pick a type.";
  if (!starts_at) errors.starts_at = "Enter a valid start time.";
  if (endsInput && !ends_at) errors.ends_at = "Enter a valid end time.";
  else if (starts_at && ends_at && ends_at < starts_at) errors.ends_at = "End must be after the start.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    event: {
      title,
      kind,
      starts_at: starts_at!,
      ends_at,
      location: text("location").slice(0, 200) || null,
      description: text("description").slice(0, 2000) || null,
    },
  };
}
