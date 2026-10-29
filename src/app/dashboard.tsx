"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { EventRow } from "@/lib/database.types";
import { EVENT_TIME_ZONE } from "@/lib/constants";

// The current time is only known in the browser, so everything time-relative
// (countdown, "up next", highlighting) is computed here and ticks every second.
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // Set immediately on mount, then tick every second.
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const start = (e: EventRow) => new Date(e.starts_at).getTime();
const end = (e: EventRow) => (e.ends_at ? new Date(e.ends_at).getTime() : start(e));
const isFood = (e: EventRow) => e.kind === "meal" || e.kind === "treat";
const isActivity = (e: EventRow) => e.kind === "event" || e.kind === "workshop";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const shortDayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
});

const time = (iso: string) => timeFmt.format(new Date(iso));
/** "9:00 AM" -> "9:00" (the big clock on the Next Event ticket). */
const clock = (iso: string) => time(iso).replace(/\s?[AP]M$/i, "");

function relativeLabel(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 1) return "Starting now";
  if (minutes < 60) return `In ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `In ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.floor(hours / 24);
  return `In ${days} day${days === 1 ? "" : "s"}`;
}

function shortCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${total % 60}s`;
}

export function Dashboard({ events }: { events: EventRow[] }) {
  const now = useNow();

  const deadline = now === null ? undefined : events.find((e) => e.kind === "deadline" && start(e) > now);
  const pastDeadline = now !== null && !deadline && events.some((e) => e.kind === "deadline");
  const nextEvent = now === null ? undefined : events.find((e) => isActivity(e) && start(e) > now);
  const nextFood = now === null ? undefined : events.find((e) => isFood(e) && end(e) > now);

  return (
    <div className="relative grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      {/* background glow behind the cards: red top-left, gold to the right of the ticket */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-24 -z-10 h-80 w-[26rem] rounded-full bg-accent/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 left-[30%] -z-10 h-64 w-72 rounded-full bg-gold/70 blur-3xl"
      />

      <div className="space-y-4">
        <NextEventTicket event={nextEvent} now={now} />

        <div className="grid grid-cols-2 gap-4">
          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-xs uppercase tracking-wider">Next meal</h2>
            {now === null ? (
              <CardSkeleton />
            ) : nextFood ? (
              <>
                <p className="mt-2 text-xl font-semibold">{nextFood.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {clock(nextFood.starts_at)}
                  {nextFood.location && ` · ${nextFood.location}`}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">No more food scheduled.</p>
            )}
          </section>

          <section className="rounded-2xl bg-card p-5 shadow-sm">
            <h2 className="text-xs uppercase tracking-wider">Submission deadline</h2>
            {now === null ? (
              <CardSkeleton />
            ) : deadline ? (
              <>
                <p className="mt-2 text-xl font-semibold tabular-nums">
                  {shortCountdown(start(deadline) - now)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {shortDayFmt.format(new Date(deadline.starts_at))} {time(deadline.starts_at)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {pastDeadline ? "Closed. Good luck!" : "No deadline posted yet"}
              </p>
            )}
          </section>
        </div>

        <Link
          href="/people"
          className="flex items-center gap-3 rounded-xl border border-foreground/60 bg-card px-4 py-3 transition hover:bg-foreground/5"
        >
          <UsersIcon />
          <span className="flex-1">Hackers looking for a team</span>
          <ChevronIcon />
        </Link>
      </div>

      <Schedule events={events} now={now} />
    </div>
  );
}

// Width of the perforated stub; the notches are centred on its left edge.
const STUB = "9rem";
const NOTCH = 11; // px radius

// Punch a half-circle out of the top and bottom edge, so whatever is behind the
// card (the background glow) shows through the notches.
const notchMask = [0, 100]
  .map(
    (y) =>
      `radial-gradient(circle ${NOTCH}px at calc(100% - ${STUB}) ${y}%, transparent ${NOTCH - 0.5}px, #000 ${NOTCH}px)`,
  )
  .join(",");

function NextEventTicket({ event, now }: { event: EventRow | undefined; now: number | null }) {
  const ring = "absolute size-[23px] -translate-x-1/2 rounded-full border border-border";
  const ringLeft = `calc(100% - ${STUB})`;
  return (
    <section className="relative flex">
      <div
        aria-hidden
        className="absolute inset-0 rounded-[20px] border border-border bg-card"
        style={{
          maskImage: notchMask,
          maskComposite: "intersect",
          WebkitMaskImage: notchMask,
          WebkitMaskComposite: "source-in",
        }}
      />
      {/* outline of each notch, clipped to the half that sits inside the card */}
      <span aria-hidden className={`${ring} top-0 -translate-y-1/2`} style={{ left: ringLeft, clipPath: "inset(50% 0 0 0)" }} />
      <span aria-hidden className={`${ring} bottom-0 translate-y-1/2`} style={{ left: ringLeft, clipPath: "inset(0 0 50% 0)" }} />

      <div className="relative min-w-0 flex-1 p-6">
        <h2 className="text-xs uppercase tracking-wider">Next event</h2>
        {now === null ? (
          <CardSkeleton />
        ) : event ? (
          <>
            <p className="mt-3 text-3xl font-bold leading-tight">{event.title}</p>
            {event.location && <p className="mt-5">{event.location}</p>}
          </>
        ) : (
          <p className="mt-3 text-muted">Nothing else on the schedule.</p>
        )}
      </div>

      {/* perforated stub */}
      <div
        className="relative flex shrink-0 flex-col items-center justify-center gap-2 border-l border-dashed border-foreground/25 p-4"
        style={{ width: STUB }}
      >
        {now !== null && event && (
          <>
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
              {relativeLabel(start(event) - now)}
            </span>
            <p className="text-3xl font-bold tabular-nums">{clock(event.starts_at)}</p>
            {event.ends_at && (
              <p className="text-xs text-muted tabular-nums">to {clock(event.ends_at)}</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="mt-3 space-y-2">
      <div className="h-6 w-2/3 animate-pulse rounded bg-foreground/10" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-foreground/10" />
    </div>
  );
}

function Schedule({ events, now }: { events: EventRow[]; now: number | null }) {
  const days = new Map<string, EventRow[]>();
  for (const e of events) {
    const day = dayFmt.format(new Date(e.starts_at));
    days.set(day, [...(days.get(day) ?? []), e]);
  }
  const dayNames = [...days.keys()];

  const [picked, setPicked] = useState<string | null>(null);
  // Until the user picks a tab, follow today (or fall back to the first day).
  const today = now === null ? undefined : dayFmt.format(new Date(now));
  const selected =
    picked && days.has(picked) ? picked : today && days.has(today) ? today : dayNames[0];
  const visible = selected ? (days.get(selected) ?? []) : [];

  return (
    <section>
      <h2 className="text-2xl font-medium">Schedule</h2>

      {dayNames.length > 0 && (
        <div className="mt-4 flex gap-4" role="tablist">
          {dayNames.map((day) => (
            <button
              key={day}
              role="tab"
              aria-selected={day === selected}
              onClick={() => setPicked(day)}
              suppressHydrationWarning
              className={`transition ${
                day === selected ? "font-medium text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {events.length === 0 && <p className="mt-6 text-sm text-muted">No events yet.</p>}

      <ol className="mt-5 space-y-3">
        {visible.map((e) => {
          const past = now !== null && end(e) < now;
          const live = now !== null && start(e) <= now && now < end(e);
          return (
            <li
              key={e.id}
              className={`relative flex gap-5 rounded-xl bg-card p-4 transition ${
                live ? "my-6 shadow-lg" : "shadow-sm"
              } ${past ? "opacity-50" : ""}`}
            >
              <div className="w-24 shrink-0 text-sm tabular-nums leading-7" suppressHydrationWarning>
                <p>{time(e.starts_at)}{e.ends_at && " -"}</p>
                {e.ends_at && <p>{time(e.ends_at)}</p>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-medium leading-snug">{e.title}</p>
                {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                {e.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                    <PinIcon />
                    {e.location}
                  </p>
                )}
              </div>
              {live && (
                <span className="absolute top-3 right-3 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold uppercase text-background">
                  Now
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function PinIcon() {
  return (
    <svg {...iconProps} className="size-4 shrink-0">
      <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg {...iconProps} className="size-5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" />
      <path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.8c2 .6 3.2 2.3 3.5 5.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg {...iconProps} strokeWidth={2.5} className="size-4">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
