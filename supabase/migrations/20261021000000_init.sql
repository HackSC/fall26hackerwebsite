-- ---------------------------------------------------------------------------
-- Schedule
-- ---------------------------------------------------------------------------

create type public.event_kind as enum ('event', 'workshop', 'meal', 'treat', 'deadline');

create table public.events (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  location    text,
  kind        public.event_kind not null default 'event',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  created_at  timestamptz not null default now(),
  constraint events_time_order check (ends_at is null or ends_at >= starts_at)
);

create index events_starts_at_idx on public.events (starts_at);

alter table public.events enable row level security;

-- Anyone (signed in or not) can read the schedule. Organizers edit events from
-- the Supabase dashboard or with the service role key, which bypasses RLS.
create policy "Schedule is public"
  on public.events for select
  to anon, authenticated
  using (true);

grant select on public.events to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Hacker profiles
-- ---------------------------------------------------------------------------

create type public.dev_role as enum ('frontend', 'backend', 'fullstack');
create type public.team_status as enum ('looking', 'has_team');

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 100),
  usc_year       text not null check (usc_year in ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other')),
  major          text not null check (char_length(major) between 1 and 100),
  email          text not null check (char_length(email) <= 254),
  discord        text check (char_length(discord) <= 64),
  link           text check (char_length(link) <= 300),
  skills         text[] not null default '{}',
  languages      text[] not null default '{}',
  role           public.dev_role not null,
  looking_for    text check (char_length(looking_for) <= 1000),
  team_size_pref smallint check (team_size_pref between 1 and 6),
  team_status    public.team_status not null default 'looking',
  -- Lowercased blob of the searchable fields, maintained by the trigger below.
  search_text    text not null default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index profiles_created_at_idx on public.profiles (created_at desc);
create index profiles_languages_idx on public.profiles using gin (languages);

create function public.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.search_text := lower(concat_ws(' ',
    new.name,
    new.major,
    new.discord,
    new.looking_for,
    array_to_string(new.skills, ' '),
    array_to_string(new.languages, ' ')
  ));
  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function public.profiles_before_write();

alter table public.profiles enable row level security;

-- Profiles (including contact info) are visible to signed-in hackers only.
create policy "Signed-in users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update, delete on public.profiles to authenticated;
