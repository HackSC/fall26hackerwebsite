-- Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

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
  (9002, 'Tomorrow talk', now() + interval '1 day', null),
  (9003, 'Ended talk', now() - interval '3 hours', now() - interval '1 hour'),
  (9004, 'Open-ended hangout', now() - interval '80 minutes', null);

-- The organizer already checked in to 9001, so we can test who sees what.
insert into public.checkins (event_id, user_id) values (9001, '22222222-2222-2222-2222-222222222222');

-- Stash the auto-created codes where non-postgres roles can read them.
select set_config('test.live_code', (select code from public.checkin_codes where event_id = 9001), true);
select set_config('test.later_code', (select code from public.checkin_codes where event_id = 9002), true);
select set_config('test.ended_code', (select code from public.checkin_codes where event_id = 9003), true);
select set_config('test.noend_code', (select code from public.checkin_codes where event_id = 9004), true);

-- ---------------------------------------------------------------- hacker
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is_empty($$select * from public.checkin_codes$$, 'hackers cannot read check-in codes');
select is(public.check_in(9001, 'nope'), 'bad_code', 'wrong code is rejected');
select is(public.check_in(9001, current_setting('test.live_code')), 'ok', 'right code during the window checks in');
select is(public.check_in(9001, current_setting('test.live_code')), 'already', 'second scan is a no-op');
select is(public.check_in(9002, current_setting('test.later_code')), 'closed', 'event outside its window is closed');
select is(public.check_in(9003, current_setting('test.ended_code')), 'closed', 'window closes 30 minutes after the end');
select is(public.check_in(9004, current_setting('test.noend_code')), 'ok', 'no-end event stays open until start + 1h + 30m');
select throws_ok(
  $$insert into public.checkins (event_id, user_id) values (9002, '11111111-1111-1111-1111-111111111111')$$,
  '42501', null, 'hackers cannot insert check-ins directly');
-- The hacker's own: 9001 and 9004. The organizer's 9001 row is hidden.
select results_eq($$select count(*)::int from public.checkins$$, array[2], 'hackers only see their own check-ins');
select throws_ok(
  $$insert into public.organizers (user_id) values ('11111111-1111-1111-1111-111111111111')$$,
  '42501', null, 'hackers cannot make themselves organizers');
select throws_ok($$update public.checkin_codes set code = 'x'$$, '42501', null, 'hackers cannot change check-in codes');
select throws_ok(
  $$insert into public.events (title, starts_at) values ('Fake', now())$$,
  '42501', null, 'hackers cannot add events');
select is_empty($$update public.events set title = 'hacked' where id = 9001 returning id$$, 'hackers cannot edit events');
select is_empty($$delete from public.events where id = 9001 returning id$$, 'hackers cannot delete events');
select isnt_empty($$select 1 from public.events where id = 9001$$, 'the event survives a hacker delete');

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
select results_eq($$select count(*)::int from public.checkins$$, array[3], 'organizers see every check-in');

select * from finish();
rollback;
