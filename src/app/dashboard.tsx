"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { EventKind, EventRow } from "@/lib/database.types";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";
import { countdownParts, eventStatus, getLiveState, relativeTime, startMs } from "@/lib/schedule";

// The current time is only known in the browser, so everything time-relative
// (countdown, "up next", highlighting) is computed here and ticks every second.
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

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

const TAG_BG: Record<EventKind, string> = {
  event: "var(--tag-event)",
  workshop: "var(--tag-workshop)",
  meal: "var(--tag-food)",
  treat: "var(--tag-food)",
  deadline: "var(--tag-deadline)",
};

// Generated sticker shown next to "Up next" and "Next food" for each kind of event.
const STICKERS: Record<EventKind, { src: string; width: number; height: number }> = {
  event: { src: "/images/sticker-laptop.webp", width: 512, height: 402 },
  workshop: { src: "/images/sticker-laptop.webp", width: 512, height: 402 },
  meal: { src: "/images/sticker-taco.webp", width: 512, height: 369 },
  treat: { src: "/images/sticker-boba.webp", width: 258, height: 512 },
  deadline: { src: "/images/sticker-trophy.webp", width: 512, height: 466 },
};

function KindTag({ kind }: { kind: EventKind }) {
  return (
    <span className={`tag text-on-tag ${kind === "event" ? "tag-event" : ""}`} style={{ background: TAG_BG[kind] }}>
      {EVENT_KIND_LABELS[kind]}
    </span>
  );
}

export function Dashboard({ events }: { events: EventRow[] }) {
  const now = useNow();
  const live = now === null ? null : getLiveState(events, now);

  return (
    <>
      <section aria-labelledby="countdown-heading" className="bg-field text-on-field">
        <div className="wrap relative pt-10 pb-12 sm:pt-16 sm:pb-20">
          <div
            className="rise pointer-events-none absolute top-1/2 right-4 hidden w-[22vw] max-w-[20rem] -translate-y-1/2 sm:right-8 lg:block"
            style={{ "--i": 3 } as React.CSSProperties}
          >
            <Image src="/images/hibiscus-3d.webp" alt="" width={927} height={1200} priority className="float h-auto w-full" />
          </div>
          <h1 id="countdown-heading" className="rise text-lead font-semibold">
            HackSC Fall &apos;26 · {live?.pastDeadline ? "Submissions" : "Submissions close in"}
          </h1>
          {!live ? (
            <div className="mt-4 h-[0.86em] w-3/4 text-monument" aria-hidden="true">
              <div className="h-full bg-on-field/10" />
            </div>
          ) : live.deadline ? (
            <>
              <Countdown ms={startMs(live.deadline) - now!} />
              <p className="rise mt-6 text-lead font-semibold" style={{ "--i": 2 } as React.CSSProperties}>
                {live.deadline.title}, {dayFmt.format(new Date(live.deadline.starts_at))} at{" "}
                {timeFmt.format(new Date(live.deadline.starts_at))}
              </p>
            </>
          ) : (
            <p className="display rise mt-4 text-title">
              {live.pastDeadline ? "Closed. Good luck, hackers." : "No deadline posted yet."}
            </p>
          )}
        </div>
      </section>

      <div className="wrap mt-14 grid gap-12 sm:mt-20 md:grid-cols-2 md:gap-16">
        <NowCard
          heading="Up next"
          event={live?.nextEvent}
          now={now}
          empty="Nothing else on the schedule."
          extra={
            live && live.happeningNow.length > 0 ? (
              <p className="mt-5">
                <span className="tag mr-2 bg-gold text-on-tag">Happening now</span>
                {live.happeningNow.map((e) => e.title).join(", ")}
              </p>
            ) : null
          }
        />
        <NowCard heading="Next food" event={live?.nextFood} now={now} empty="No more food scheduled." />
      </div>

      <Schedule events={events} now={now} />
    </>
  );
}

function Countdown({ ms }: { ms: number }) {
  const { days, hours, minutes, seconds } = countdownParts(ms);
  const totalHours = days * 24 + hours;
  const groups = [totalHours, minutes, seconds].map((n) => String(n).padStart(2, "0"));

  return (
    <>
      <p className="sr-only">
        {totalHours} hours and {minutes} minutes left.
      </p>
      <p
        aria-hidden="true"
        className="display rise mt-3 text-monument tabular-nums"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        {groups.map((g, i) => (
          <span key={i}>
            {i > 0 && <span className="opacity-60">:</span>}
            {/* Re-keying on the value replays the drop-in only for digits that changed. */}
            <span key={g} className="digit-in">
              {g}
            </span>
          </span>
        ))}
      </p>
    </>
  );
}

function NowCard({
  heading,
  event,
  now,
  empty,
  extra,
}: {
  heading: string;
  event: EventRow | undefined;
  now: number | null;
  empty: string;
  extra?: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lead font-semibold text-muted">{heading}</h2>
        {now !== null && event && (
          <Image
            key={event.id}
            src={STICKERS[event.kind].src}
            alt=""
            width={STICKERS[event.kind].width}
            height={STICKERS[event.kind].height}
            className="rise h-20 w-auto sm:h-24"
          />
        )}
      </div>
      {now === null ? (
        <div className="mt-4 space-y-3" aria-hidden="true">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-5 w-1/2" />
        </div>
      ) : event ? (
        <div className="mt-3">
          <p className="display text-title">{event.title}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg">
            <span className="tag bg-ink text-ground">{relativeTime(startMs(event), now)}</span>
            <span className="tabular-nums">{formatRange(event)}</span>
            {event.location && <span className="text-muted">{event.location}</span>}
          </p>
          {event.description && <p className="mt-4 max-w-prose text-muted">{event.description}</p>}
        </div>
      ) : (
        <p className="mt-3 text-lg text-muted">{empty}</p>
      )}
      {extra}
    </section>
  );
}

function Schedule({ events, now }: { events: EventRow[]; now: number | null }) {
  const days = new Map<string, EventRow[]>();
  for (const e of events) {
    const day = dayFmt.format(new Date(e.starts_at));
    days.set(day, [...(days.get(day) ?? []), e]);
  }

  return (
    <section aria-labelledby="schedule-heading" className="wrap mt-24 sm:mt-32">
      <h2 id="schedule-heading" className="display text-title">
        Schedule
      </h2>
      {events.length === 0 && (
        <div className="mt-6 flex items-center gap-6">
          <Image src="/images/sticker-palm.webp" alt="" width={459} height={512} className="h-24 w-auto" />
          <p className="text-lg text-muted">No events yet. Check back soon.</p>
        </div>
      )}
      {[...days].map(([day, dayEvents]) => (
        <div key={day} className="mt-12 lg:grid lg:grid-cols-12 lg:gap-16">
          <h3 className="text-lead font-semibold lg:col-span-3 lg:pt-3" suppressHydrationWarning>
            {day}
          </h3>
          <ol className="mt-4 lg:col-span-9 lg:mt-0">
            {dayEvents.map((e) => {
              const status = now === null ? "upcoming" : eventStatus(e, now);
              return (
                <li
                  key={e.id}
                  aria-current={status === "live" ? "time" : undefined}
                  className={`grid gap-x-6 gap-y-1 px-3 py-3 sm:grid-cols-[11rem_1fr] ${
                    status === "live" ? "bg-surface-2" : ""
                  } ${status === "past" ? "text-muted" : ""}`}
                >
                  <span className="tabular-nums" suppressHydrationWarning>
                    {formatRange(e)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-semibold">{e.title}</span>
                      {status === "live" && <span className="tag bg-gold text-on-tag">Live</span>}
                      {e.kind !== "event" && <KindTag kind={e.kind} />}
                    </span>
                    {e.location && <span className="block text-muted">{e.location}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
