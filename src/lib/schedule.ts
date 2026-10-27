// Pure, time-relative schedule logic. No runtime imports so `node --test` can
// load it directly (see schedule.test.mjs).
import type { EventKind, EventRow } from "./database.types";

export const startMs = (e: EventRow) => new Date(e.starts_at).getTime();
export const endMs = (e: EventRow) => (e.ends_at ? new Date(e.ends_at).getTime() : startMs(e));

const isFood = (k: EventKind) => k === "meal" || k === "treat";
const isActivity = (k: EventKind) => k === "event" || k === "workshop";

export type EventStatus = "past" | "live" | "upcoming";

export function eventStatus(e: EventRow, now: number): EventStatus {
  if (now < startMs(e)) return "upcoming";
  return now < endMs(e) ? "live" : "past";
}

export type LiveState = {
  /** The next deadline that hasn't passed yet. */
  deadline: EventRow | undefined;
  /** True once every deadline on the schedule is behind us. */
  pastDeadline: boolean;
  happeningNow: EventRow[];
  nextEvent: EventRow | undefined;
  /** The meal or treat being served now, or the next one. */
  nextFood: EventRow | undefined;
};

/** Expects events sorted by start time (as getSchedule returns them). */
export function getLiveState(events: EventRow[], now: number): LiveState {
  const deadline = events.find((e) => e.kind === "deadline" && startMs(e) > now);
  return {
    deadline,
    pastDeadline: !deadline && events.some((e) => e.kind === "deadline"),
    happeningNow: events.filter((e) => isActivity(e.kind) && eventStatus(e, now) === "live"),
    nextEvent: events.find((e) => isActivity(e.kind) && startMs(e) > now),
    nextFood: events.find((e) => isFood(e.kind) && endMs(e) > now),
  };
}

export function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** "Now", "in 1 min", "in 45 min", "in 2h 05m". Rounds up so it never says "in 0 min". */
export function relativeTime(startAt: number, now: number): string {
  if (startAt <= now) return "Now";
  const minutes = Math.ceil((startAt - now) / 60000);
  if (minutes < 60) return `in ${minutes} min`;
  return `in ${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}
