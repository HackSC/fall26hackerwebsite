-- Sample schedule, relative to when the seed runs so the home page always has
-- something upcoming. Replace with the real schedule before the event.
insert into public.events (title, description, location, kind, starts_at, ends_at) values
  ('Check-in & Team Mixer',   'Grab your badge and meet potential teammates.', 'SAL Lobby',          'event',    now() - interval '2 hours',  now() - interval '1 hour'),
  ('Opening Ceremony',        'Kickoff, sponsor intros, and rules.',           'Bovard Auditorium',  'event',    now() - interval '1 hour',   now() - interval '30 minutes'),
  ('Hacking Begins',          null,                                            'Everywhere',         'event',    now() - interval '30 minutes', null),
  ('Dinner',                  'Pizza and salads.',                             'SAL Courtyard',      'meal',     now() + interval '1 hour',   now() + interval '2 hours'),
  ('Intro to Supabase',       'Auth, Postgres, and RLS in 45 minutes.',        'SAL 101',            'workshop', now() + interval '2 hours',  now() + interval '2 hours 45 minutes'),
  ('Midnight Boba',           null,                                            'SAL Lobby',          'treat',    now() + interval '5 hours',  now() + interval '5 hours 30 minutes'),
  ('Breakfast',               'Bagels and coffee.',                            'SAL Courtyard',      'meal',     now() + interval '13 hours', now() + interval '14 hours'),
  ('Submissions Due',         'Submit your project on Devpost.',               'Online',             'deadline', now() + interval '20 hours', null),
  ('Lunch',                   null,                                            'SAL Courtyard',      'meal',     now() + interval '20 hours 30 minutes', now() + interval '21 hours 30 minutes'),
  ('Judging & Demos',         'Show off what you built.',                      'SAL 1st Floor',      'event',    now() + interval '21 hours', now() + interval '23 hours'),
  ('Closing Ceremony',        'Awards and wrap-up.',                           'Bovard Auditorium',  'event',    now() + interval '23 hours', now() + interval '24 hours');
