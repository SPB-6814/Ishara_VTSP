-- Ishara: Row Level Security Policies
-- Migration 002: RLS for all tables

-- Enable RLS on all tables
alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.session_events enable row level security;
alter table public.isl_clips enable row level security;
alter table public.interpreter_presence enable row level security;

-- ============================================================
-- HOSPITALS
-- ============================================================

-- Hospital staff can read their own hospital
create policy "Users can read their own hospital"
  on public.hospitals for select
  using (
    id in (
      select hospital_id from public.profiles where id = auth.uid()
    )
  );

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Hospital staff can read profiles within their hospital
create policy "Hospital staff can read hospital profiles"
  on public.profiles for select
  using (
    hospital_id in (
      select hospital_id from public.profiles where id = auth.uid()
    )
  );

-- All authenticated users can see interpreters (name + role only, enforced at query level)
create policy "Authenticated users can see interpreters"
  on public.profiles for select
  using (
    role = 'interpreter' and auth.uid() is not null
  );

-- ============================================================
-- SESSIONS
-- ============================================================

-- Hospital staff/doctors can read sessions from their hospital
create policy "Hospital users can read their sessions"
  on public.sessions for select
  using (
    hospital_id in (
      select hospital_id from public.profiles where id = auth.uid()
    )
  );

-- Assigned interpreter can read their session
create policy "Interpreter can read assigned session"
  on public.sessions for select
  using (assigned_interpreter_id = auth.uid());

-- Hospital staff/doctors can create sessions
create policy "Hospital users can create sessions"
  on public.sessions for insert
  with check (
    hospital_id in (
      select hospital_id from public.profiles where id = auth.uid()
    )
  );

-- Hospital staff/doctors can update sessions from their hospital
create policy "Hospital users can update their sessions"
  on public.sessions for update
  using (
    hospital_id in (
      select hospital_id from public.profiles where id = auth.uid()
    )
  );

-- Assigned interpreter can update session status
create policy "Interpreter can update assigned session"
  on public.sessions for update
  using (assigned_interpreter_id = auth.uid());

-- ============================================================
-- SESSION_EVENTS
-- ============================================================

-- Hospital staff can read events for their hospital's sessions
create policy "Hospital users can read session events"
  on public.session_events for select
  using (
    session_id in (
      select id from public.sessions
      where hospital_id in (
        select hospital_id from public.profiles where id = auth.uid()
      )
    )
  );

-- Assigned interpreter can read events for their session
create policy "Interpreter can read assigned session events"
  on public.session_events for select
  using (
    session_id in (
      select id from public.sessions where assigned_interpreter_id = auth.uid()
    )
  );

-- Authenticated users can insert events (actor_id is set by the API)
create policy "Authenticated users can log events"
  on public.session_events for insert
  with check (auth.uid() is not null);

-- ============================================================
-- ISL_CLIPS
-- ============================================================

-- Anyone can read ISL clips (not patient data)
create policy "ISL clips are publicly readable"
  on public.isl_clips for select
  using (true);

-- Only service role can insert/update/delete (enforced by not having policies for those)

-- ============================================================
-- INTERPRETER_PRESENCE
-- ============================================================

-- Interpreters can manage their own presence
create policy "Interpreters can manage own presence"
  on public.interpreter_presence for all
  using (interpreter_id = auth.uid());

-- All authenticated users can see interpreter presence (for request routing)
create policy "Authenticated users can see interpreter presence"
  on public.interpreter_presence for select
  using (auth.uid() is not null);
