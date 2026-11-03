-- Only @usc.edu addresses can create accounts. Runs as the Supabase Auth
-- "before user created" hook, so it also covers sign-ups made straight
-- against the Auth API (bypassing the app's own form check).
-- Existing accounts are untouched; this only gates new users.
--
-- Enable on the hosted project: Dashboard -> Authentication -> Hooks ->
-- "Before User Created" -> Postgres function public.hook_before_user_created.

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  email text := lower(trim(coalesce(event->'user'->>'email', '')));
begin
  if email ~ '^[^@[:space:]]+@usc[.]edu$' then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Sign up with your @usc.edu email.'
    )
  );
end;
$$;

grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
