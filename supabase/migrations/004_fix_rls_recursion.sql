-- Fix infinite recursion in RLS policies for profiles and related tables
create or replace function public.get_auth_hospital_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select hospital_id from public.profiles where id = auth.uid();
$$;

drop policy if exists "Hospital staff can read hospital profiles" on public.profiles;
create policy "Hospital staff can read hospital profiles"
  on public.profiles for select
  using (
    hospital_id is not null and hospital_id = public.get_auth_hospital_id()
  );

drop policy if exists "Hospital users can read their sessions" on public.sessions;
create policy "Hospital users can read their sessions"
  on public.sessions for select
  using (
    hospital_id = public.get_auth_hospital_id()
  );

drop policy if exists "Hospital users can create sessions" on public.sessions;
create policy "Hospital users can create sessions"
  on public.sessions for insert
  with check (
    hospital_id = public.get_auth_hospital_id()
  );

drop policy if exists "Hospital users can update their sessions" on public.sessions;
create policy "Hospital users can update their sessions"
  on public.sessions for update
  using (
    hospital_id = public.get_auth_hospital_id()
  );

drop policy if exists "Hospital users can read session events" on public.session_events;
create policy "Hospital users can read session events"
  on public.session_events for select
  using (
    session_id in (
      select id from public.sessions
      where hospital_id = public.get_auth_hospital_id()
    )
  );

drop policy if exists "Users can read their own hospital" on public.hospitals;
create policy "Users can read their own hospital"
  on public.hospitals for select
  using (
    id = public.get_auth_hospital_id()
  );
