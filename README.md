# Fall '26 Hackathon

Hacker-facing site: a live dashboard (deadline countdown, next event, next meal, full schedule) and a People directory for team formation.

**Stack:** Next.js 16 (App Router, Cache Components) · Supabase (Postgres + Auth via `@supabase/ssr`) · Tailwind CSS v4

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com/dashboard).
2. **Apply the schema.** Either paste `supabase/migrations/20261021000000_init.sql` into the dashboard's SQL Editor, or use the CLI:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   `db push` applies every file in `supabase/migrations/`, including `20261031000000_checkins.sql` (organizers and QR check-in). If you use the SQL Editor instead, run each migration in order.
   For sample events, also run `supabase/seed.sql` in the SQL Editor. Its times are relative to `now()`.
3. **Configure auth redirects.** Under Authentication → URL Configuration, set Site URL to `http://localhost:3000` and add `http://localhost:3000/**` (and your production URL + `/**`) to Redirect URLs.
4. **Add env vars:**
   ```bash
   cp .env.example .env.local   # then fill in URL + publishable key
   ```
5. **Run it:**
   ```bash
   npm install
   npm run dev
   ```

### Fully local alternative (needs Docker)

```bash
npx supabase start        # prints a local URL + publishable key for .env.local
npx supabase db reset     # applies migrations + seed.sql
```

Magic-link emails show up in Mailpit at http://127.0.0.1:54324.

### Tests

```bash
npm test                  # JS unit tests (src/lib/*.test.mjs)
npx supabase test db      # pgTAP database tests in supabase/tests/ (needs local Supabase / Docker)
```

## Pages

| Route | What it does |
| --- | --- |
| `/` | Submission countdown, next event (plus anything happening now), next meal/treat, and the full schedule on the right. Updates every second in the browser. |
| `/people` | Searchable, filterable, sortable list of hacker profiles with email / Discord / link. Requires sign-in. |
| `/people/[id]` | A single hacker's full profile. |
| `/profile` | Create or edit your own profile. |
| `/login` | Email magic-link sign-in. |
| `/admin` | Organizers only: add, edit and delete schedule events, and open each event's check-in QR. |
| `/admin/events/[id]/qr` | Full-screen-ish QR for an event plus who has checked in. Put it on a screen at the door. |
| `/checkin/[eventId]/[code]` | What the QR opens. Hackers tap "Check me in". |

## Data model

- **`events`**: the schedule. `kind` is one of `event`, `workshop`, `meal`, `treat`, `deadline`. The countdown targets the next `deadline` row, and "next meal/treat" uses `meal` and `treat` rows. Anyone can read it. Organizers edit it at `/admin`.
- **`profiles`**: one row per user (`id` = `auth.users.id`). Only signed-in users can read it, and each user can only insert, update, or delete their own row. A trigger maintains `search_text`, which backs the People search box.
- **`organizers`**: user ids allowed to edit the schedule and see check-ins. There is no UI or API to add one. Run this in the SQL editor:
  `insert into public.organizers (user_id) select id from auth.users where email = 'you@usc.edu';`
- **`checkin_codes`**: one random code per event, created by a trigger. Only organizers can read it.
- **`checkins`**: who checked in to what. Written only by the `check_in(event_id, code)` function, which checks the code, the time window (30 minutes before start until 30 minutes after end, or 90 minutes after start when there's no end) and that the hacker has a profile. Hackers see their own rows; organizers see all.

The home page caches the schedule for about a minute (`"use cache"` + `cacheLife("minutes")` in `src/lib/data.ts`). Saving or deleting an event at `/admin` refreshes it right away (`updateTag("events")`). Edits made elsewhere (Table Editor, SQL) show up within a minute, and until then a newly added event's QR and check-in pages can 404.

## Code map

```
src/
  proxy.ts                  refreshes the Supabase session cookie on each request
  lib/supabase/server.ts    createClient() (as the user) / createPublicClient() (anon, cacheable)
  lib/supabase/client.ts    browser client for Client Components
  lib/auth.ts               getCurrentUser() — verified via getClaims()
  lib/data.ts               all DB queries
  lib/database.types.ts     table types (regenerate: npx supabase gen types typescript --linked)
  app/dashboard.tsx         home page countdown + schedule (client)
  app/people/               directory, filters, profile cards, detail page
  app/profile/              profile form + saveProfile server action
  app/auth/                 magic-link action, sign-out, /auth/callback code exchange
  app/admin/                organizer schedule editor + check-in QR page
  app/checkin/              hacker check-in page + checkIn server action
  lib/event-form.ts         event form parsing, LA time <-> UTC conversion
supabase/
  migrations/               schema + RLS
  seed.sql                  sample schedule
  tests/                    pgTAP database tests (npx supabase test db)
```

## Notes

- Supabase's built-in email sender is heavily rate-limited (a few emails per hour). Configure custom SMTP under Authentication → Emails before the event.
- Scanning the QR with a real phone needs the site on a public HTTPS URL, and that URL (plus `/**`) must be in Supabase Auth's Redirect URLs, or the sign-in link drops the check-in page.
- To restrict sign-ups to `@usc.edu`, add a check in `sendMagicLink` (`src/app/auth/actions.ts`) and/or a Supabase Auth hook.
