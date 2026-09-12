# Ishara — Handoff Document

> **From:** Vibhav (going to sleep 😴)
> **To:** Teammate picking this up
> **Time written:** 2026-09-12 ~12:30 IST
> **Time remaining:** ~24 hours to submission

---

## What is Ishara?

A hospital communication platform for Deaf/mute patients who use Indian Sign Language (ISL). Three core flows:

1. **P0 — Pictogram Grid:** Patient taps emergency icons (Chest pain, Can't breathe, etc.) → instant alert to staff. Zero dependencies, must always work.
2. **P1 — Live Interpreter Call:** Staff requests interpreter → interpreter accepts → 2-party video call (patient tablet ↔ interpreter) via LiveKit WebRTC. This is the main product.
3. **P2 — ISL Clip Fallback:** Staff speaks/types a phrase → fuzzy matched to pre-recorded ISL video clips → clip plays fullscreen on patient tablet. Fallback when no interpreter available.
4. **P3 — Gesture-to-Text (stretch):** Client-side hand gesture recognition. Only if time allows.

## What's done

- ✅ Full architecture spec → [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- ✅ Design system with colors, typography, spacing → [`DESIGN.md`](DESIGN.md)
- ✅ Logo → [`design/logo.png`](design/logo.png)
- ✅ Database schema (6 tables) → [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
- ✅ Row Level Security policies → [`supabase/migrations/002_rls_policies.sql`](supabase/migrations/002_rls_policies.sql)
- ✅ Seed data (1 demo hospital + 48 ISL clips with aliases) → [`supabase/migrations/003_seed_data.sql`](supabase/migrations/003_seed_data.sql)

## What needs to be built (in priority order)

### Step 1: Scaffold the repo (30 min)

```bash
bun create next-app@latest . --typescript --tailwind --eslint --app --src=no --import-alias "@/*"
bunx shadcn@latest init
bun add @supabase/supabase-js @supabase/ssr fuse.js
bun add @livekit/components-react livekit-client livekit-server-sdk
```

Set up these env vars in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=
DEMO_MODE=true
```

### Step 2: Translate DESIGN.md → Tailwind config

Key tokens from `DESIGN.md`:
- **Primary:** `#084C5B` (deep teal)
- **Secondary:** `#4F46E5` (indigo, for interpreter portal)
- **Error/Emergency:** `#DC2626`
- **Success:** `#16A34A`
- **Warning:** `#D97706`
- **Background:** `#F8FAFC`
- **Text:** `#0F172A`
- **Headings font:** Plus Jakarta Sans (Google Fonts)
- **Body font:** Manrope (Google Fonts)

### Step 3: Build routes (all pages)

```
/app/login/page.tsx                        → Two big cards: "I'm with a hospital" / "I'm an ISL interpreter"
/app/auth/hospital/page.tsx                → Magic link auth (or DEMO_MODE quick-login)
/app/auth/interpreter/page.tsx             → Magic link auth (or DEMO_MODE quick-login)
/app/auth/callback/route.ts                → Supabase auth callback
/app/dashboard/[sessionId]/page.tsx        → Staff/doctor view (transcript feed, alerts, controls)
/app/patient/[sessionId]/page.tsx          → Patient tablet (pictogram grid, video player, staff controls drawer)
/app/interpreter/dashboard/page.tsx        → Availability toggle, incoming request list, accept button
/app/interpreter/call/[sessionId]/page.tsx → Interpreter's video call view
/app/api/session/route.ts                  → POST: create session
/app/api/session/[id]/events/route.ts      → POST: log event, GET: fetch events
/app/api/session/[id]/request-interpreter/route.ts
/app/api/session/[id]/status/route.ts
/app/api/isl-lookup/route.ts              → Fuse.js fuzzy match → signed clip URL
/app/api/patient/[sessionId]/events/route.ts  → Patient event logging (uses service role)
/app/api/patient/[sessionId]/clips/route.ts   → Trigger clip playback
/app/api/livekit-token/route.ts            → Mint LiveKit room tokens
/app/api/interpreter/heartbeat/route.ts
```

### Step 4: Build P0 first (pictogram grid → alert)

This is the most important flow. Build it end to end:

1. Patient page shows a 3×3 grid of large icons: Chest pain, Can't breathe, Dizzy, Very sick, Call doctor, Emergency, Help, Allergy, Pain level
2. Patient taps one → POST to API → API broadcasts on Supabase Realtime channel `session:{sessionId}` → staff dashboard shows emergency alert banner
3. Also logs event to `session_events` table (async, don't block the alert)
4. **Touch targets must be 56px+ minimum.** High contrast. Text + icon, not color alone.

### Step 5: Build P2 (clip lookup → playback)

1. Staff controls drawer has a text input + mic button (Web Speech API)
2. Staff types/speaks a phrase → POST to `/api/isl-lookup` → Fuse.js searches against `isl_clips` table (label + aliases)
3. Match found (score > 0.55) → return signed Supabase Storage URL → broadcast `play_clip` event on Realtime
4. Patient tablet receives event → auto-plays clip fullscreen in `<video>` element
5. No match → show "No matching clip — try rephrasing or request interpreter"

### Step 6: Build P1 (interpreter video call)

1. Staff clicks "Request Interpreter" → POST to API → updates session status → broadcasts on `interpreter-requests` Realtime channel
2. Interpreter dashboard shows the request with session details + big "Accept" button
3. Interpreter clicks Accept → API mints LiveKit tokens for both parties → updates session status
4. Patient tablet + interpreter both join the LiveKit room → 2-party video call
5. Doctor is physically at the bedside — speaks through the tablet mic to the interpreter

### Step 7: Polish + demo prep

- Loading states, error toasts, empty states
- Auto-fallback: if interpreter doesn't accept in 60s → suggest AI clips
- Pain scale component (1-10 emoji slider)
- Session audit log page
- Dark mode on staff/interpreter screens
- Accessibility check (contrast, touch targets, keyboard nav)

## Demo setup (2 devices)

| Device | Shows | Who uses it |
|--------|-------|-------------|
| **Tablet** (or laptop in responsive mode) | `/patient/[sessionId]` — patient taps pictograms, sees ISL clips, video call with interpreter. Has a "Staff Controls" drawer the doctor pulls up. | Patient + Doctor (doctor is physically present at bedside) |
| **Laptop/phone** | `/interpreter/dashboard` → `/interpreter/call/[sessionId]` — interpreter sees requests, accepts, joins video call | Teammate role-playing interpreter |
| **Optional 3rd device** | `/dashboard/[sessionId]` — nurse station monitoring view, sees all alerts | Nice for pitch, not required |

## DEMO_MODE auth

When `DEMO_MODE=true`, the login page should show quick-login buttons:
- "Login as Demo Doctor" → pre-seeded doctor account
- "Login as Demo Interpreter" → pre-seeded interpreter account

This skips magic link emails during the demo. Pre-seed accounts when setting up Supabase.

## Tech stack summary

| What | Tech |
|------|------|
| Framework | Next.js 15 (App Router), TypeScript |
| Runtime/PM | Bun |
| Database | Supabase Postgres |
| Auth | Supabase Auth (magic link) |
| File storage | Supabase Storage (`isl-clips` bucket) |
| Realtime | Supabase Realtime (broadcast channels) |
| Video calls | LiveKit Cloud (free tier) |
| UI | Tailwind CSS + shadcn/ui |
| Fuzzy match | Fuse.js |
| Speech | Web Speech API (Chrome only) |
| Deploy | Vercel |

## Supabase Realtime channels

| Channel | Purpose | Events |
|---------|---------|--------|
| `session:{sessionId}` | All intra-session comms | `pictogram_alert`, `play_clip`, `status_change`, `gesture_text` |
| `interpreter-requests` | Global interpreter paging | `new_request` (with session info) |
| `interpreter-presence` | Track who's online | Supabase Realtime presence |

## Key files to read

1. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — Full architecture with mermaid diagram
2. **[`DESIGN.md`](DESIGN.md)** — Complete design system (colors, typography, spacing, components)
3. **[`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)** — Database tables
4. **[`supabase/migrations/003_seed_data.sql`](supabase/migrations/003_seed_data.sql)** — 48 ISL clips with all aliases

## Don't forget

- **ISL video clips** need to be uploaded to Supabase Storage bucket `isl-clips`. Filenames match the `key` field (e.g. `chest-pain.mp4`).
- **Patient has NO login.** They open `/patient/[sessionId]` directly. The UUID in the URL is the auth token.
- **P0 pictograms must work even if LiveKit and everything else is down.** It's just Realtime broadcast — no dependencies.
- **Web Speech API is Chrome-only.** Always have the text input as fallback.
- **48px minimum touch targets** on patient screens. These are hospital patients who may be in pain, elderly, or distressed.

Good luck! 🤞
