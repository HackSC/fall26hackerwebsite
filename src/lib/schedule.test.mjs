import { test } from "node:test";
import assert from "node:assert/strict";
import { countdownParts, eventStatus, getLiveState, relativeTime } from "./schedule.ts";

const NOW = Date.parse("2026-10-26T20:00:00Z");
const at = (min) => new Date(NOW + min * 60000).toISOString();
let id = 0;
const ev = (kind, startMin, endMin = null) => ({
  id: ++id,
  title: `${kind} ${startMin}`,
  description: null,
  location: null,
  kind,
  starts_at: at(startMin),
  ends_at: endMin === null ? null : at(endMin),
  created_at: at(-1000),
});

test("countdownParts splits ms and clamps negatives to zero", () => {
  assert.deepEqual(countdownParts(((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000 + 999), {
    days: 1,
    hours: 2,
    minutes: 3,
    seconds: 4,
  });
  assert.deepEqual(countdownParts(-5000), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test("relativeTime rounds up and pads minutes past the hour", () => {
  assert.equal(relativeTime(NOW, NOW), "Now");
  assert.equal(relativeTime(NOW + 20_000, NOW), "in 1 min");
  assert.equal(relativeTime(NOW + 45 * 60000, NOW), "in 45 min");
  assert.equal(relativeTime(NOW + 125 * 60000, NOW), "in 2h 05m");
});

test("eventStatus treats an event with no end as a moment", () => {
  assert.equal(eventStatus(ev("event", -10, 10), NOW), "live");
  assert.equal(eventStatus(ev("event", -10), NOW), "past");
  assert.equal(eventStatus(ev("event", 10), NOW), "upcoming");
});

test("getLiveState picks the live, next and food events", () => {
  const live = ev("workshop", -30, 30);
  const dinner = ev("meal", -15, 45);
  const next = ev("event", 60, 90);
  const deadline = ev("deadline", 600);
  const s = getLiveState([ev("event", -120, -60), live, dinner, next, ev("treat", 300, 330), deadline], NOW);
  assert.deepEqual(s.happeningNow, [live]);
  assert.equal(s.nextEvent, next);
  assert.equal(s.nextFood, dinner, "food being served now still counts");
  assert.equal(s.deadline, deadline);
  assert.equal(s.pastDeadline, false);
});

test("getLiveState reports a passed deadline only when one existed", () => {
  assert.equal(getLiveState([ev("deadline", -5)], NOW).pastDeadline, true);
  assert.equal(getLiveState([ev("event", 5)], NOW).pastDeadline, false);
  assert.equal(getLiveState([], NOW).deadline, undefined);
});
