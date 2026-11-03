# Event Check-in and Schedule Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or work the checkboxes in order to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organizers manage the schedule from the site and put up a QR code for each event; hackers scan it with their phone camera to check in.

**Architecture:** Everything stays in the existing Supabase + Next.js server-action setup; there is no separate API service. Postgres holds the rules: an `organizers` table gates who can edit events, each event gets a secret check-in code in an organizer-only table, and a `check_in()` database function is the only way to create a check-in. It checks the code, the time window, and that the hacker has a profile. Hackers can't insert check-ins directly, because the Supabase API is reachable from any browser with the publishable key, so RLS and the function are the real security boundary, not the Next.js pages.

**Tech Stack:** Next.js 16 (App Router, Cache Components, `updateTag`), Supabase Postgres + RLS + pgTAP (`npx supabase test db`), Tailwind 4, `qrcode` (new dependency, server-side SVG).

---

## Decisions (agreed with DY on 2026-10-31)

- **Hackers scan the event's QR.** The organizer shows the QR on a screen or prints it. The QR opens `/checkin/<eventId>/<code>`, and the hacker taps "Check me in".
- **Anti-cheat is a time window, not identity checks.** Check-in only works from 30 minutes before `starts_at` until 30 minutes after `ends_at`. When `ends_at` is empty, the window closes 30 minutes after `starts_at + 1 hour`. Someone can still text a photo of the QR to a friend during that window. That's the accepted trade-off of this flow.
- **"Backend" scope:** check-in plus an organizer schedule editor at `/admin`. Organizers are added by hand in SQL (see README task).

**Skipped on purpose (YAGNI):** rotating a leaked code, organizers undoing a check-in, a hacker-facing "events I attended" list, live-updating attendance (refresh the page), CSV export (use the Supabase Table Editor), and an "Admin" link in the nav (organizers bookmark `/admin`).

## Before you start

- Work in `/Users/dyl/HackSC/fall26hackerwebsite`. Start from the current branch, which has the new UI:
  ```bash
  git checkout redesign/hacksc-design-system && git checkout -b feat/checkin-admin
  ```
- `supabase/config.toml` has an **uncommitted** port change (54xxx → 57xxx), so this repo's local Supabase doesn't clash with other projects. Never commit it. Always `git add` exact paths, never `git add -A` or `.`.
- Local Supabase runs in Docker: API `http://127.0.0.1:57321`, DB port `57322`, Mailpit (magic-link emails) `http://127.0.0.1:57324`. `.env.local` already points at it. Start it with `npx supabase start` if `npx supabase status` says it's stopped.
- `npx supabase db reset` re-applies all migrations plus `seed.sql` and **wipes local data**, including local users. That's fine here.
- This Next.js has breaking changes from what you may know. Before writing a page or action, skim `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md` (`updateTag`) and look at an existing page (`src/app/profile/page.tsx`). Pages that read cookies keep a static shell and put the dynamic part inside `<Suspense>`.
- JS unit tests are plain `node --test` files that import `.ts` directly (Node 22 strips types). Those `.ts` files must have **no runtime imports**; `import type` is fine.

## File map

| File | Responsibility |
| --- | --- |
| `supabase/migrations/20261031000000_checkins.sql` (create) | `organizers`, `is_organizer()`, organizer write policies on `events`, `checkin_codes` + auto-create trigger, `checkins`, `check_in()` |
| `supabase/tests/checkins_test.sql` (create) | pgTAP tests for every rule above |
| `src/lib/database.types.ts` (modify) | Hand-written types for the new tables and functions |
| `src/lib/event-form.ts` + `event-form.test.mjs` (create) | Pure: LA wall-clock ⇄ ISO conversion, event form validation |
| `src/lib/data.ts` (modify) | `getEvent`, `isOrganizer`, `getCheckinCode`, `getAttendance` |
| `src/lib/auth.ts` (modify) | `requireOrganizer(next)` |
| `src/app/admin/page.tsx` (create) | Event list for organizers |
| `src/app/admin/actions.ts` (create) | `saveEvent`, `deleteEvent` server actions |
| `src/app/admin/event-form.tsx` (create) | Create/edit form (client) |
| `src/app/admin/events/[id]/page.tsx` (create) | Editor page; `id = "new"` creates |
| `src/app/admin/events/[id]/qr/page.tsx` (create) | Big QR code + who checked in |
| `src/app/checkin/actions.ts` (create) | `checkIn` server action → `check_in()` |
| `src/app/checkin/checkin-button.tsx` (create) | "Check me in" button + result (client) |
| `src/app/checkin/[eventId]/[code]/page.tsx` (create) | What the QR opens |
| `package.json` (modify) | `qrcode`, `@types/qrcode`, `test` script |
| `README.md` (modify) | Pages, data model, how to add an organizer |

---

### Task 1: Database schema and rules (TDD with pgTAP)

**Files:**
- Create: `supabase/tests/checkins_test.sql`
- Create: `supabase/migrations/20261031000000_checkins.sql`

- [ ] **Step 1: Write the failing pgTAP test**

Create `supabase/tests/checkins_test.sql`:

```sql
-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Fixtures, inserted as postgres (bypasses RLS).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'hacker@usc.edu'),
  ('22222222-2222-2222-2222-222222222222', 'organizer@usc.edu'),
  ('33333333-3333-3333-3333-333333333333', 'noprofile@usc.edu');

insert into public.profiles (id, name, usc_year, major, email, role) values
  ('11111111-1111-1111-1111-111111111111', 'Hacker', 'Junior', 'CS', 'hacker@usc.edu', 'backend'),
  ('22222222-2222-2222-2222-222222222222', 'Organizer', 'Senior', 'CS', 'organizer@usc.edu', 'backend');

insert into public.organizers (user_id) values ('22222222-2222-2222-2222-222222222222');

insert into public.events (id, title, starts_at, ends_at) overriding system value values
  (9001, 'Live workshop', now() - interval '10 minutes', now() + interval '50 minutes'),
  (9002, 'Tomorrow talk', now() + interval '1 day', null);

-- The organizer already checked in to 9001, so we can test who sees what.
insert into public.checkins (event_id, user_id) values (9001, '22222222-2222-2222-2222-222222222222');

-- Stash the auto-created codes where non-postgres roles can read them.
select set_config('test.live_code', (select code from public.checkin_codes where event_id = 9001), true);
select set_config('test.later_code', (select code from public.checkin_codes where event_id = 9002), true);

-- ---------------------------------------------------------------- hacker
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is_empty($$select * from public.checkin_codes$$, 'hackers cannot read check-in codes');
select is(public.check_in(9001, 'nope'), 'bad_code', 'wrong code is rejected');
select is(public.check_in(9001, current_setting('test.live_code')), 'ok', 'right code during the window checks in');
select is(public.check_in(9001, current_setting('test.live_code')), 'already', 'second scan is a no-op');
select is(public.check_in(9002, current_setting('test.later_code')), 'closed', 'event outside its window is closed');
select throws_ok(
  $$insert into public.checkins (event_id, user_id) values (9002, '11111111-1111-1111-1111-111111111111')$$,
  '42501', null, 'hackers cannot insert check-ins directly');
select results_eq($$select count(*)::int from public.checkins$$, array[1], 'hackers only see their own check-ins');
select throws_ok(
  $$insert into public.events (title, starts_at) values ('Fake', now())$$,
  '42501', null, 'hackers cannot add events');
select is_empty($$update public.events set title = 'hacked' where id = 9001 returning id$$, 'hackers cannot edit events');

-- ---------------------------------------------------------------- signed in, no profile
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select is(public.check_in(9001, current_setting('test.live_code')), 'no_profile', 'a profile is required');

-- ---------------------------------------------------------------- anon
reset role;
set local role anon;
select throws_ok($$select public.check_in(9001, 'x')$$, '42501', null, 'anon cannot call check_in');

-- ---------------------------------------------------------------- organizer
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select isnt_empty($$select * from public.checkin_codes where event_id = 9001$$, 'organizers can read codes');
select lives_ok($$insert into public.events (title, starts_at) values ('Org event', now())$$, 'organizers can add events');
select isnt_empty(
  $$select 1 from public.checkin_codes c join public.events e on e.id = c.event_id where e.title = 'Org event'$$,
  'new events get a code automatically');
select results_eq($$select count(*)::int from public.checkins$$, array[2], 'organizers see every check-in');

select * from finish();
rollback;
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx supabase test db`
Expected: FAIL. The first error is `relation "public.organizers" does not exist`.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20261031000000_checkins.sql`:

```sql
-- Organizers, schedule editing, and QR check-in.

-- ---------------------------------------------------------------------------
-- Organizers: added by hand in the SQL editor (see README). No write policies,
-- so nobody can make themselves an organizer through the API.
-- ---------------------------------------------------------------------------

create table public.organizers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

alter table public.organizers enable row level security;

create policy "Organizers can see their own row"
  on public.organizers for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.organizers from anon, authenticated;
grant select on public.organizers to authenticated;

create function public.is_organizer()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from public.organizers where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_organizer() from public, anon;
grant execute on function public.is_organizer() to authenticated;

-- ---------------------------------------------------------------------------
-- Organizers edit the schedule (reads stay public, from the init migration).
-- ---------------------------------------------------------------------------

create policy "Organizers can add events"
  on public.events for insert
  to authenticated
  with check ((select public.is_organizer()));

create policy "Organizers can edit events"
  on public.events for update
  to authenticated
  using ((select public.is_organizer()))
  with check ((select public.is_organizer()));

create policy "Organizers can delete events"
  on public.events for delete
  to authenticated
  using ((select public.is_organizer()));

grant insert, update, delete on public.events to authenticated;

-- ---------------------------------------------------------------------------
-- One secret code per event. Kept out of `events`, which anyone can read.
-- ---------------------------------------------------------------------------

create table public.checkin_codes (
  event_id bigint primary key references public.events (id) on delete cascade,
  code     text not null default replace(gen_random_uuid()::text, '-', '')
);

alter table public.checkin_codes enable row level security;

create policy "Organizers can read check-in codes"
  on public.checkin_codes for select
  to authenticated
  using ((select public.is_organizer()));

revoke all on public.checkin_codes from anon, authenticated;
grant select on public.checkin_codes to authenticated;

create function public.events_create_checkin_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.checkin_codes (event_id) values (new.id);
  return null;
end;
$$;

create trigger events_create_checkin_code
  after insert on public.events
  for each row execute function public.events_create_checkin_code();

insert into public.checkin_codes (event_id)
select id from public.events
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Check-ins. Only check_in() writes here.
-- ---------------------------------------------------------------------------

create table public.checkins (
  event_id   bigint not null references public.events (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index checkins_user_id_idx on public.checkins (user_id);

alter table public.checkins enable row level security;

create policy "Hackers see their own check-ins, organizers see all"
  on public.checkins for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_organizer()));

revoke all on public.checkins from anon, authenticated;
grant select on public.checkins to authenticated;

-- Returns one of: ok, already, bad_code, closed, no_profile, signed_out.
create function public.check_in(p_event_id bigint, p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ev  public.events;
begin
  if uid is null then
    return 'signed_out';
  end if;

  select e.* into ev
  from public.events e
  join public.checkin_codes c on c.event_id = e.id
  where e.id = p_event_id and c.code = p_code;

  if not found then
    return 'bad_code';
  end if;

  if now() < ev.starts_at - interval '30 minutes'
     or now() > coalesce(ev.ends_at, ev.starts_at + interval '1 hour') + interval '30 minutes' then
    return 'closed';
  end if;

  if not exists (select 1 from public.profiles where id = uid) then
    return 'no_profile';
  end if;

  insert into public.checkins (event_id, user_id)
  values (p_event_id, uid)
  on conflict do nothing;

  return case when found then 'ok' else 'already' end;
end;
$$;

revoke execute on function public.check_in(bigint, text) from public, anon;
grant execute on function public.check_in(bigint, text) to authenticated;
```

- [ ] **Step 4: Apply it and run the tests**

Run: `npx supabase db reset && npx supabase test db`
Expected: `checkins_test.sql .. ok`, `All tests successful.`, 15 tests.

If `bad_code`/`ok` fail with "permission denied for function", the revoke ran after Supabase's default grants: check that the `grant execute ... to authenticated` line is present.

- [ ] **Step 5: Run Supabase's security advisor**

Run: `npx supabase db lint --level warning`
Expected: no errors. Zero warnings is fine. (`check_in` and the trigger function are `security definer` on purpose; the dashboard's Security Advisor may flag that later.)

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261031000000_checkins.sql supabase/tests/checkins_test.sql
git commit -m "feat(db): organizers, schedule editing rules, QR check-in"
```

---

### Task 2: TypeScript types for the new tables

**Files:**
- Modify: `src/lib/database.types.ts`

This file is hand-written (it has custom aliases at the bottom), so don't regenerate it. Edit it.

- [ ] **Step 1: Add the status type** under `export type TeamStatus = ...`:

```ts
export type CheckinStatus = "ok" | "already" | "bad_code" | "closed" | "no_profile" | "signed_out";
```

- [ ] **Step 2: Add three tables** inside `Tables`, after `profiles`:

```ts
      organizers: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
      checkin_codes: {
        Row: { event_id: number; code: string };
        Insert: { event_id: number; code?: string };
        Update: { event_id?: number; code?: string };
        Relationships: [];
      };
      checkins: {
        Row: { event_id: number; user_id: string; created_at: string };
        Insert: { event_id: number; user_id: string };
        Update: { event_id?: number; user_id?: string };
        Relationships: [
          {
            foreignKeyName: "checkins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
```

- [ ] **Step 3: Replace** `Functions: { [_ in never]: never };` with:

```ts
    Functions: {
      is_organizer: { Args: Record<string, never>; Returns: boolean };
      check_in: { Args: { p_event_id: number; p_code: string }; Returns: CheckinStatus };
    };
```

- [ ] **Step 4: Add an alias** at the bottom:

```ts
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (pass).

- [ ] **Step 6: Commit**

```bash
git add src/lib/database.types.ts
git commit -m "feat(types): organizers, checkin_codes, checkins, check_in()"
```

---

### Task 3: Event form logic (pure, TDD)

**Files:**
- Create: `src/lib/event-form.test.mjs`
- Create: `src/lib/event-form.ts`
- Modify: `package.json` (`scripts`)

Organizers type times in LA time (`<input type="datetime-local">` gives `"2026-11-07T18:30"` with no zone). The server runs in UTC, so we convert explicitly. That's the one tricky bit, and it's why this gets tests.

- [ ] **Step 1: Write the failing test**

Create `src/lib/event-form.test.mjs`:

```js
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
```

- [ ] **Step 2: Add a test script and run it to see it fail**

In `package.json` `scripts`, add `"test": "node --test src/lib/*.test.mjs"`.

Run: `npm test`
Expected: FAIL with `Cannot find module '.../src/lib/event-form.ts'`. The existing 5 schedule tests still pass.

- [ ] **Step 3: Implement**

Create `src/lib/event-form.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS, 12 tests (5 schedule + 7 event-form).

- [ ] **Step 5: Commit**

```bash
git add src/lib/event-form.ts src/lib/event-form.test.mjs package.json
git commit -m "feat: event form parsing with LA time conversion"
```

---

### Task 4: Data and auth helpers

**Files:**
- Modify: `src/lib/data.ts` (append)
- Modify: `src/lib/auth.ts` (append)

- [ ] **Step 1: Append to `src/lib/data.ts`**

Add `EventRow` to the existing type import if it isn't there (it already is). Then append:

```ts
// ---------------------------------------------------------------------------
// Organizers and check-in (per-user, RLS-scoped)
// ---------------------------------------------------------------------------

/** One event from the cached schedule. */
export async function getEvent(id: number): Promise<EventRow | null> {
  const { events } = await getSchedule();
  return events.find((e) => e.id === id) ?? null;
}

export async function isOrganizer(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_organizer");
  return data === true;
}

/** RLS returns nothing unless the caller is an organizer. */
export async function getCheckinCode(eventId: number): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("checkin_codes").select("code").eq("event_id", eventId).maybeSingle();
  return data?.code ?? null;
}

export async function getAttendance(eventId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkins")
    .select("created_at, profiles(id, name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return { checkins: data ?? [], error: error?.message ?? null };
}
```

- [ ] **Step 2: Append to `src/lib/auth.ts`**

```ts
/** Sends signed-out users to login and hides the page from everyone who isn't an organizer. */
export async function requireOrganizer(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!(await isOrganizer())) notFound();
  return user;
}
```

Add these imports at the top of `auth.ts`:

```ts
import { notFound, redirect } from "next/navigation";
import { isOrganizer } from "@/lib/data";
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: pass. If `c.profiles` is typed as an array in `getAttendance`, the `Relationships` entry from Task 2 is wrong. Recheck it before working around it.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data.ts src/lib/auth.ts
git commit -m "feat: organizer and check-in data helpers"
```

---

### Task 5: Organizer schedule editor

**Files:**
- Create: `src/app/admin/actions.ts`
- Create: `src/app/admin/event-form.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/events/[id]/page.tsx`

- [ ] **Step 1: Server actions** in `src/app/admin/actions.ts`:

```ts
"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrganizer } from "@/lib/auth";
import { EVENT_TIME_ZONE } from "@/lib/constants";
import { parseEventForm, type EventFieldErrors } from "@/lib/event-form";
import { createClient } from "@/lib/supabase/server";

export type EventFormState = { status: "idle" | "error"; message?: string; fieldErrors?: EventFieldErrors };

export async function saveEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  await requireOrganizer("/admin");

  const parsed = parseEventForm(Object.fromEntries(formData), EVENT_TIME_ZONE);
  if (!parsed.ok) return { status: "error", message: "Fix the highlighted fields.", fieldErrors: parsed.errors };

  const id = Number(formData.get("id"));
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("events").update(parsed.event).eq("id", id)
    : await supabase.from("events").insert(parsed.event);
  if (error) return { status: "error", message: error.message };

  updateTag("events");
  redirect("/admin");
}

export async function deleteEvent(formData: FormData) {
  await requireOrganizer("/admin");
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", Number(formData.get("id")));
  if (error) throw new Error(`Couldn't delete the event: ${error.message}`);
  updateTag("events");
  redirect("/admin");
}
```

- [ ] **Step 2: The form** in `src/app/admin/event-form.tsx`. Submit through a transition, like `src/app/profile/profile-form.tsx` does, so React doesn't wipe the inputs on a validation error:

```tsx
"use client";

import { startTransition, useActionState } from "react";
import type { EventRow } from "@/lib/database.types";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";
import { isoToZoned } from "@/lib/event-form";
import { deleteEvent, saveEvent, type EventFormState } from "./actions";

export function EventForm({ event }: { event: EventRow | null }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(saveEvent, { status: "idle" });
  const errors = state.fieldErrors ?? {};
  const invalid = (k: keyof typeof errors) =>
    errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {};
  const errorText = (k: keyof typeof errors) =>
    errors[k] && (
      <p id={`${k}-error`} className="mt-1 text-sm font-semibold text-danger">
        {errors[k]}
      </p>
    );
  const local = (iso: string | null | undefined) => (iso ? isoToZoned(iso, EVENT_TIME_ZONE) : "");

  return (
    <form
      className="mt-6 space-y-5"
      onSubmit={(e) => {
        // Let the delete button run its own formAction; preventDefault would cancel it.
        if ((e.nativeEvent as SubmitEvent).submitter?.hasAttribute("data-delete")) return;
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      {event && <input type="hidden" name="id" value={event.id} />}

      <div>
        <label htmlFor="title" className="field-label">Title</label>
        <input id="title" name="title" required maxLength={200} defaultValue={event?.title} className="input" {...invalid("title")} />
        {errorText("title")}
      </div>

      <div>
        <label htmlFor="kind" className="field-label">Type</label>
        <select id="kind" name="kind" defaultValue={event?.kind ?? "event"} className="input" {...invalid("kind")}>
          {Object.entries(EVENT_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {errorText("kind")}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="field-label">Starts (LA time)</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={local(event?.starts_at)} className="input" {...invalid("starts_at")} />
          {errorText("starts_at")}
        </div>
        <div>
          <label htmlFor="ends_at" className="field-label">Ends (optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" defaultValue={local(event?.ends_at)} className="input" {...invalid("ends_at")} />
          {errorText("ends_at")}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="field-label">Location</label>
        <input id="location" name="location" maxLength={200} defaultValue={event?.location ?? ""} className="input" />
      </div>

      <div>
        <label htmlFor="description" className="field-label">Description</label>
        <textarea id="description" name="description" rows={3} maxLength={2000} defaultValue={event?.description ?? ""} className="input" />
      </div>

      {state.status === "error" && (
        <p role="alert" className="font-semibold text-danger">{state.message}</p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Saving…" : event ? "Save changes" : "Create event"}
        </button>
        {event && (
          <button
            type="submit"
            data-delete
            formNoValidate
            formAction={deleteEvent}
            className="btn-quiet text-danger"
            onClick={(e) => {
              if (!confirm(`Delete "${event.title}"? Its check-ins are deleted too.`)) e.preventDefault();
            }}
          >
            Delete event
          </button>
        )}
      </div>
    </form>
  );
}
```

Note: React skips a button's `formAction` when the form's `onSubmit` calls `preventDefault()`, hence the `data-delete` early return. Clicking "Cancel" in the confirm dialog cancels the click, so no submit happens. Task 8 checks both paths in the browser.

- [ ] **Step 3: Event list** in `src/app/admin/page.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";
import { requireOrganizer } from "@/lib/auth";
import { getSchedule } from "@/lib/data";
import { EVENT_KIND_LABELS, EVENT_TIME_ZONE } from "@/lib/constants";

const when = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export default function AdminPage() {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-title">Schedule</h1>
        <Link href="/admin/events/new" className="btn">New event</Link>
      </div>
      <Suspense fallback={<div className="skeleton mt-8 h-96" />}>
        <EventList />
      </Suspense>
    </div>
  );
}

async function EventList() {
  await requireOrganizer("/admin");
  const { events, error } = await getSchedule();
  if (error) return <p role="alert" className="mt-8 font-semibold text-danger">{error}</p>;
  if (events.length === 0) return <p className="mt-8 text-muted">No events yet.</p>;

  return (
    <ul className="mt-8 divide-y divide-border">
      {events.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-sm text-muted">
              {EVENT_KIND_LABELS[e.kind]} · {when.format(new Date(e.starts_at))}
              {e.location && ` · ${e.location}`}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link href={`/admin/events/${e.id}`} className="link">Edit</Link>
            <Link href={`/admin/events/${e.id}/qr`} className="link">Check-in QR</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Editor page** in `src/app/admin/events/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireOrganizer } from "@/lib/auth";
import { getEvent } from "@/lib/data";
import { EventForm } from "../../event-form";

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">← Schedule</Link>
      <Suspense fallback={<div className="skeleton mt-6 h-96" />}>
        <Editor params={params} />
      </Suspense>
    </div>
  );
}

async function Editor({ params }: Pick<PageProps<"/admin/events/[id]">, "params">) {
  const { id } = await params;
  await requireOrganizer(`/admin/events/${id}`);

  const event = id === "new" ? null : await getEvent(Number(id));
  if (id !== "new" && !event) notFound();

  return (
    <>
      <h1 className="mt-4 text-2xl font-bold">{event ? "Edit event" : "New event"}</h1>
      <EventForm event={event} />
    </>
  );
}
```

- [ ] **Step 5: Type-check and lint**

Run: `npx tsc --noEmit && npx eslint src/app/admin`
Expected: pass. If `PageProps<"/admin/events/[id]">` is unknown, run `npx next typegen` once (or start `npm run dev`) so Next generates route types.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin
git commit -m "feat: organizer schedule editor at /admin"
```

---

### Task 6: QR code page for organizers

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/app/admin/events/[id]/qr/page.tsx`

- [ ] **Step 1: Install**

Run: `npm install qrcode@1.5.4 && npm install -D @types/qrcode@1.5.6`

- [ ] **Step 2: Page** in `src/app/admin/events/[id]/qr/page.tsx`:

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import QRCode from "qrcode";
import { requireOrganizer } from "@/lib/auth";
import { getAttendance, getCheckinCode, getEvent } from "@/lib/data";
import { EVENT_TIME_ZONE } from "@/lib/constants";

const time = new Intl.DateTimeFormat("en-US", { timeZone: EVENT_TIME_ZONE, hour: "numeric", minute: "2-digit" });

export default function EventQrPage({ params }: PageProps<"/admin/events/[id]/qr">) {
  return (
    <div>
      <Link href="/admin" className="text-sm text-muted hover:text-foreground">← Schedule</Link>
      <Suspense fallback={<div className="skeleton mt-6 h-[28rem]" />}>
        <EventQr params={params} />
      </Suspense>
    </div>
  );
}

async function EventQr({ params }: Pick<PageProps<"/admin/events/[id]/qr">, "params">) {
  const { id } = await params;
  await requireOrganizer(`/admin/events/${id}/qr`);

  const event = await getEvent(Number(id));
  if (!event) notFound();
  const [code, { checkins, error }] = await Promise.all([getCheckinCode(event.id), getAttendance(event.id)]);
  if (!code) notFound(); // every event gets one from the insert trigger

  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}/checkin/${event.id}/${code}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2 });

  return (
    <div className="mt-4 grid gap-10 lg:grid-cols-2">
      <section>
        <h1 className="display text-title">{event.title}</h1>
        <p className="mt-2 text-muted">
          Scan with your phone camera to check in. Works from 30 minutes before the start until 30 minutes after the end.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URL, nothing to optimize */}
        <img
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`}
          alt={`QR code that checks hackers in to ${event.title}`}
          className="mt-6 aspect-square w-full max-w-md bg-white"
        />
        <p className="mt-3 break-all text-xs text-muted">{url}</p>
      </section>

      <section>
        <h2 className="text-lead font-semibold">{checkins.length} checked in</h2>
        <p className="text-sm text-muted">Refresh to update.</p>
        {error && <p role="alert" className="mt-2 font-semibold text-danger">{error}</p>}
        <ul className="mt-4 divide-y divide-border">
          {checkins.map((c) => (
            <li key={c.profiles?.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>{c.profiles?.name}</span>
              <span className="text-muted">{time.format(new Date(c.created_at))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Type-check, lint, build**

Run: `npx tsc --noEmit && npx eslint src/app/admin && npx next build`
Expected: pass. In the build output, `/admin/events/[id]/qr` is a partial-prerender (◐) or dynamic route, and the build doesn't error with "Uncached data was accessed outside of `<Suspense>`".

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json "src/app/admin/events/[id]/qr/page.tsx"
git commit -m "feat: per-event check-in QR and attendance list"
```

---

### Task 7: Hacker check-in page

**Files:**
- Create: `src/app/checkin/actions.ts`
- Create: `src/app/checkin/checkin-button.tsx`
- Create: `src/app/checkin/[eventId]/[code]/page.tsx`

The page doesn't check in on load. Visiting a URL shouldn't change data (link previews and prefetches would trigger it), so the hacker taps one button.

- [ ] **Step 1: Action** in `src/app/checkin/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { CheckinStatus } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type CheckinState = {
  status: "idle" | "done" | "error";
  message?: string;
  needsProfile?: boolean;
};

const ERRORS: Record<Exclude<CheckinStatus, "ok" | "already">, string> = {
  bad_code: "This QR code isn't valid. Ask an organizer.",
  closed: "Check-in for this event isn't open right now.",
  no_profile: "Make your hacker profile first, then scan again.",
  signed_out: "Sign in first.",
};

export async function checkIn(_prev: CheckinState, formData: FormData): Promise<CheckinState> {
  const eventId = Number(formData.get("event_id"));
  const code = String(formData.get("code") ?? "");

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${eventId}/${code}`)}`);
  if (!Number.isSafeInteger(eventId) || !/^[0-9a-f]{32}$/.test(code)) {
    return { status: "error", message: ERRORS.bad_code };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_in", { p_event_id: eventId, p_code: code });
  if (error) return { status: "error", message: error.message };

  if (data === "ok") return { status: "done", message: "You're checked in. Have fun!" };
  if (data === "already") return { status: "done", message: "You're already checked in." };
  return { status: "error", message: ERRORS[data], needsProfile: data === "no_profile" };
}
```

- [ ] **Step 2: Button** in `src/app/checkin/checkin-button.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useActionState } from "react";
import { checkIn, type CheckinState } from "./actions";

export function CheckinButton({ eventId, code }: { eventId: number; code: string }) {
  const [state, action, pending] = useActionState<CheckinState, FormData>(checkIn, { status: "idle" });

  if (state.status === "done") {
    return (
      <div role="status" className="rise mt-8 bg-surface p-6">
        <p className="text-lead font-semibold">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="code" value={code} />
      {state.status === "error" && (
        <p role="alert" className="font-semibold text-danger">
          {state.message}{" "}
          {state.needsProfile && <Link href="/profile" className="link">Make your profile</Link>}
        </p>
      )}
      <button type="submit" className="btn w-full" disabled={pending}>
        {pending ? "Checking in…" : "Check me in"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Page** in `src/app/checkin/[eventId]/[code]/page.tsx`:

```tsx
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getEvent } from "@/lib/data";
import { CheckinButton } from "../../checkin-button";

export default function CheckinPage({ params }: PageProps<"/checkin/[eventId]/[code]">) {
  return (
    <div className="mx-auto max-w-md pt-6 text-center">
      <Suspense fallback={<div className="skeleton h-64" />}>
        <Checkin params={params} />
      </Suspense>
    </div>
  );
}

async function Checkin({ params }: Pick<PageProps<"/checkin/[eventId]/[code]">, "params">) {
  const { eventId, code } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkin/${eventId}/${code}`)}`);

  const event = await getEvent(Number(eventId));
  if (!event) notFound();

  return (
    <>
      <p className="text-sm text-muted">Check in to</p>
      <h1 className="display mt-2 text-title">{event.title}</h1>
      {event.location && <p className="mt-2 text-muted">{event.location}</p>}
      <CheckinButton eventId={event.id} code={code} />
    </>
  );
}
```

- [ ] **Step 4: Type-check, lint, build**

Run: `npx tsc --noEmit && npx eslint src/app/checkin && npx next build`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkin
git commit -m "feat: hacker QR check-in page"
```

---

### Task 8: End-to-end check in the browser

Use the built-in browser on `npm run dev` (launch via `.claude/launch.json` / `preview_start`). It runs against local Supabase.

- [ ] **Step 1:** `npx supabase db reset`. Then sign in at `/login` as `organizer@example.test`, using the magic link from Mailpit at `http://127.0.0.1:57324`. Create a profile at `/profile`.
- [ ] **Step 2:** Make that user an organizer:
  ```bash
  docker exec -i supabase_db_fall26hackerwebsite psql -U postgres -c \
    "insert into public.organizers (user_id) select id from auth.users where email = 'organizer@example.test';"
  ```
- [ ] **Step 3:** `/admin` lists the seeded events. Create an event that starts now, edit its title, and check that `/` shows the new title. Then try to submit an end before the start: you should get an inline error, and the other fields keep their values.
- [ ] **Step 4:** Open the event's "Check-in QR" page. The QR renders, and the URL under it is `http://localhost:3000/checkin/<id>/<32 hex>`.
- [ ] **Step 5:** Copy the check-in URL, sign out (the built-in browser shares cookies across tabs), sign in as `hacker@example.test`, and open that URL. You should be asked to make a profile. Make one and open the URL again. "Check me in" shows "You're checked in". Tap again on a reload, and it shows "already checked in".
- [ ] **Step 6:** Sign back in as the organizer and refresh the QR page. It shows "1 checked in" with the hacker's name.
- [ ] **Step 7:** As the hacker, `/admin` shows a 404. Opening the check-in URL of a seeded "Breakfast" event (13 hours out) with a made-up code says "isn't valid".
- [ ] **Step 8:** Delete the test event from its edit page. The confirm dialog appears, the event is gone from `/admin` and `/`.
- [ ] **Step 9:** Phone at 375px width: the check-in page has no horizontal scroll.

Real phone scanning needs the site on a public HTTPS URL (Vercel preview or a tunnel). `localhost` QR codes only open on the laptop itself.

---

### Task 9: README

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Add rows to the Pages table:

```markdown
| `/admin` | Organizers only: add, edit and delete schedule events, and open each event's check-in QR. |
| `/admin/events/[id]/qr` | Full-screen-ish QR for an event plus who has checked in. Put it on a screen at the door. |
| `/checkin/[eventId]/[code]` | What the QR opens. Hackers tap "Check me in". |
```

- [ ] **Step 2:** Replace the `events` bullet's last sentence ("Organizers edit it in the Supabase Table Editor…") with "Organizers edit it at `/admin`." Then add to Data model:

```markdown
- **`organizers`**: user ids allowed to edit the schedule and see check-ins. There is no UI or API to add one. Run this in the SQL editor:
  `insert into public.organizers (user_id) select id from auth.users where email = 'you@usc.edu';`
- **`checkin_codes`**: one random code per event, created by a trigger. Only organizers can read it.
- **`checkins`**: who checked in to what. Written only by the `check_in(event_id, code)` function, which checks the code, the time window (30 minutes before start until 30 minutes after end) and that the hacker has a profile. Hackers see their own rows; organizers see all.
```

- [ ] **Step 3:** Under Setup step 2, note that `npx supabase db push` now also applies `20261031000000_checkins.sql`, and that `npx supabase test db` runs the database tests. Then add `npm test` for the JS tests.

- [ ] **Step 4: Final checks and commit**

Run: `npm test && npx supabase test db && npx tsc --noEmit && npx eslint && npx next build`
Expected: all pass.

```bash
git add README.md
git commit -m "docs: check-in and admin"
```
