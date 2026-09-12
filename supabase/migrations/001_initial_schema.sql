-- Ishara: Initial Schema
-- Migration 001: Core tables for the hospital communication platform

-- 1. Hospitals
create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. User profiles (linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('hospital_staff', 'doctor', 'hospital_admin', 'interpreter')),
  full_name text,
  hospital_id uuid references public.hospitals(id),
  created_at timestamptz not null default now()
);

-- 3. Communication sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id),
  patient_display_name text,
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'interpreter_requested', 'interpreter_connected', 'ai_fallback', 'closed')),
  active_mode text check (active_mode in ('pictogram', 'ai_fallback', 'live_interpreter', 'gesture_ai')),
  assigned_interpreter_id uuid references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- 4. Session event audit trail
create table public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  event_type text not null check (event_type in (
    'pictogram', 'isl_played', 'gesture_text', 'staff_message',
    'interpreter_requested', 'interpreter_joined', 'interpreter_left', 'note'
  )),
  payload jsonb,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 5. ISL video clip library
create table public.isl_clips (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,            -- slug, e.g. 'chest-pain'
  label text not null,                 -- human-readable, e.g. 'Chest pain'
  aliases text[] default '{}',         -- alternate phrasings for fuzzy match
  category text,                       -- Emergency / Pain / Allergies / Basic needs / ...
  priority text check (priority in ('P0', 'P1', 'P2')),
  storage_path text not null,          -- path inside 'isl-clips' Storage bucket
  duration_seconds int,
  created_at timestamptz not null default now()
);

-- 6. Interpreter presence tracking
create table public.interpreter_presence (
  interpreter_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'offline'
    check (status in ('available', 'busy', 'offline')),
  last_heartbeat timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_sessions_hospital on public.sessions(hospital_id);
create index idx_sessions_status on public.sessions(status) where status != 'closed';
create index idx_session_events_session on public.session_events(session_id);
create index idx_session_events_created on public.session_events(session_id, created_at);
create index idx_profiles_hospital on public.profiles(hospital_id);
create index idx_profiles_role on public.profiles(role);
create index idx_interpreter_presence_status on public.interpreter_presence(status) where status = 'available';
create index idx_isl_clips_category on public.isl_clips(category);
