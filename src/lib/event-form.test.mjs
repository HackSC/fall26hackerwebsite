import { test } from "node:test";
import assert from "node:assert/strict";
import { isoToZoned, parseEventForm, zonedToIso } from "./event-form.ts";

const LA = "America/Los_Angeles";

test("zonedToIso handles daylight and standard time", () => {
  assert.equal(zonedToIso("2026-10-31T18:00", LA), "2026-11-01T01:00:00.000Z"); // PDT, UTC-7
  assert.equal(zonedToIso("2026-11-07T18:00", LA), "2026-11-08T02:00:00.000Z"); // PST, UTC-8
});

test("zonedToIso rejects junk and times that don't exist", () => {
  assert.equal(zonedToIso("", LA), null);
  assert.equal(zonedToIso("tomorrow", LA), null);
  assert.equal(zonedToIso("2026-02-31T10:00", LA), null);
  assert.equal(zonedToIso("2026-03-08T02:30", LA), null); // skipped by spring-forward
});

test("isoToZoned is the inverse", () => {
  assert.equal(isoToZoned("2026-11-08T02:00:00.000Z", LA), "2026-11-07T18:00");
  assert.equal(isoToZoned("2026-11-01T07:05:00+00:00", LA), "2026-11-01T00:05");
});

const valid = {
  title: "  Intro to Supabase ",
  kind: "workshop",
  starts_at: "2026-11-07T18:00",
  ends_at: "2026-11-07T18:45",
  location: "SAL 101",
  description: "",
};

test("parseEventForm trims and converts a valid form", () => {
  assert.deepEqual(parseEventForm(valid, LA), {
    ok: true,
    event: {
      title: "Intro to Supabase",
      kind: "workshop",
      starts_at: "2026-11-08T02:00:00.000Z",
      ends_at: "2026-11-08T02:45:00.000Z",
      location: "SAL 101",
      description: null,
    },
  });
});

test("parseEventForm allows no end time", () => {
  const r = parseEventForm({ ...valid, ends_at: "" }, LA);
  assert.equal(r.ok && r.event.ends_at, null);
});

test("parseEventForm reports each bad field", () => {
  const r = parseEventForm({ title: "", kind: "party", starts_at: "x", ends_at: "" }, LA);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ["kind", "starts_at", "title"]);
});

test("parseEventForm rejects an end before the start", () => {
  const r = parseEventForm({ ...valid, ends_at: "2026-11-07T17:00" }, LA);
  assert.equal(r.ok, false);
  assert.ok(r.errors.ends_at);
});
