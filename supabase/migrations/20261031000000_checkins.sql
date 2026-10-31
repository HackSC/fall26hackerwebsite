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
