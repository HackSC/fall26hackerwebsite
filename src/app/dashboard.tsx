"use client";

import { useEffect, useState } from "react";
import type { EventRow } from "@/lib/database.types";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";

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
  weekday: "long",
  month: "short",
  day: "numeric",
});

function formatRange(e: EventRow) {
  const s = timeFmt.format(new Date(e.starts_at));
  return e.ends_at ? `${s} – ${timeFmt.format(new Date(e.ends_at))}` : s;
}

export function Dashboard({ events }: { events: EventRow[] }) {
  const now = useNow();

  const deadline = now === null ? undefined : events.find((e) => e.kind === "deadline" && start(e) > now);
  const pastDeadline = now !== null && !deadline && events.some((e) => e.kind === "deadline");
  const happeningNow =
    now === null ? [] : events.filter((e) => isActivity(e) && start(e) <= now && now < end(e));
  const nextEvent = now === null ? undefined : events.find((e) => isActivity(e) && start(e) > now);
  const nextFood = now === null ? undefined : events.find((e) => isFood(e) && end(e) > now);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card bg-accent text-accent-foreground border-transparent">
          <p className="text-sm uppercase tracking-widest opacity-80">
            {pastDeadline ? "Submissions" : "Submissions close in"}
          </p>
          {now === null ? (
            <div className="mt-3 h-16 w-3/4 animate-pulse rounded-lg bg-white/15" />
          ) : deadline ? (
            <>
              <Countdown ms={start(deadline) - now} />
              <p className="mt-2 text-sm opacity-80">
                {deadline.title} · {dayFmt.format(new Date(deadline.starts_at))},{" "}
                {timeFmt.format(new Date(deadline.starts_at))}
              </p>
            </>
          ) : (
            <p className="mt-2 text-4xl font-semibold">
              {pastDeadline ? "Closed — good luck!" : "No deadline posted yet"}
            </p>
          )}
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="card">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted">Next event</h2>
            {now === null ? (
              <CardSkeleton />
            ) : nextEvent ? (
              <EventSummary event={nextEvent} now={now} />
            ) : (
              <p className="mt-3 text-muted">Nothing else on the schedule.</p>
            )}
            {happeningNow.length > 0 && (
              <div className="mt-4 border-t border-border pt-3 text-sm">
                <span className="font-medium text-accent">Happening now: </span>
                {happeningNow.map((e) => e.title).join(", ")}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="text-sm font-medium uppercase tracking-widest text-muted">
              Next meal / treat
            </h2>
            {now === null ? (
              <CardSkeleton />
            ) : nextFood ? (
              <EventSummary event={nextFood} now={now} />
            ) : (
              <p className="mt-3 text-muted">No more food scheduled.</p>
            )}
          </section>
        </div>
      </div>

      <Schedule events={events} now={now} />
    </div>
  );
}

function Countdown({ ms }: { ms: number }) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const parts = [
    { label: "days", value: Math.floor(total / 86400) },
    { label: "hrs", value: Math.floor((total % 86400) / 3600) },
    { label: "min", value: Math.floor((total % 3600) / 60) },
    { label: "sec", value: total % 60 },
  ];

  return (
    <div className="mt-3 flex gap-4 font-mono sm:gap-6">
      {parts.map((p) => (
        <div key={p.label}>
          <div className="text-4xl font-semibold tabular-nums sm:text-6xl">
            {String(p.value).padStart(2, "0")}
          </div>
          <div className="text-xs uppercase tracking-widest opacity-75">{p.label}</div>
        </div>
      ))}
    </div>
  );
}

function EventSummary({ event, now }: { event: EventRow; now: number }) {
  const live = start(event) <= now;
  const minutes = Math.round((start(event) - now) / 60000);
  const relative = live
    ? "Now"
    : minutes < 60
      ? `in ${minutes} min`
      : `in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  return (
    <div className="mt-3">
      <p className="text-xl font-semibold">{event.title}</p>
      <p className="mt-1 text-sm text-muted">
        {formatRange(event)}
        {event.location && ` · ${event.location}`}
      </p>
      {event.description && <p className="mt-2 text-sm">{event.description}</p>}
      <span className={`chip mt-3 ${live ? "border-accent text-accent" : ""}`}>{relative}</span>
    </div>
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

  return (
    <aside className="card h-fit lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <h2 className="text-lg font-semibold">Full schedule</h2>
      {events.length === 0 && <p className="mt-3 text-sm text-muted">No events yet.</p>}
      {[...days].map(([day, dayEvents]) => (
        <div key={day} className="mt-5">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-muted" suppressHydrationWarning>
            {day}
          </h3>
          <ol className="space-y-1">
            {dayEvents.map((e) => {
              const past = now !== null && end(e) < now;
              const live = now !== null && start(e) <= now && now < end(e);
              return (
                <li
                  key={e.id}
                  className={`flex gap-3 rounded-lg px-2 py-1.5 text-sm ${
                    live ? "bg-accent/10" : ""
                  } ${past ? "opacity-45" : ""}`}
                >
                  <span className="w-32 shrink-0 tabular-nums text-muted" suppressHydrationWarning>
                    {formatRange(e)}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{e.title}</span>
                    {e.kind !== "event" && (
                      <span
                        className={`chip ml-2 ${e.kind === "deadline" ? "border-accent text-accent" : ""}`}
                      >
                        {EVENT_KIND_LABELS[e.kind]}
                      </span>
                    )}
                    {e.location && <span className="block text-xs text-muted">{e.location}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </aside>
  );
}
