import { NextResponse } from 'next/server'
import { RoomServiceClient } from 'livekit-server-sdk'
import { createServiceClient } from '@/lib/supabase/service'
import { toValidSessionUuid, UUID_REGEX } from '@/lib/realtime'

// In-memory fallback session store if DB unreachable
const inMemorySessions = new Map<string, any>()

/**
 * Verify actual live statuses against real-time infrastructure:
 * 1. An active LiveKit room with participants MUST exist for 'interpreter_connected'.
 * 2. An active interpreter page MUST have occurred within the last 45s for 'interpreter_requested'.
 * If stale/disconnected, auto-heals session status back to 'active' (active triage).
 */
async function verifyAndCorrectSessions(sessions: any[], supabase: any): Promise<any[]> {
  if (!sessions || sessions.length === 0) return sessions

  // 1. Query active rooms with participants from LiveKit
  let activeLiveKitRooms = new Set<string>()
  if (process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET) {
    try {
      const livekitUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud').replace('wss://', 'https://')
      const svc = new RoomServiceClient(livekitUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET)
      const rooms = await svc.listRooms()
      for (const r of rooms) {
        if (r.numParticipants && r.numParticipants > 0) {
          activeLiveKitRooms.add(r.name)
        }
      }
    } catch (err) {
      console.warn('LiveKit room verification notice:', err)
    }
  }

  // 2. Query recent interpreter_requested events for sessions marked as 'interpreter_requested'
  const requestedSessionIds = sessions
    .filter((s) => s.status === 'interpreter_requested')
    .map((s) => s.id)

  let recentValidPages = new Set<string>()
  if (requestedSessionIds.length > 0 && supabase) {
    try {
      const cutoffTime = new Date(Date.now() - 45_000).toISOString()
      const { data: recentEvents } = await supabase
        .from('session_events')
        .select('session_id, created_at')
        .in('session_id', requestedSessionIds)
        .eq('event_type', 'interpreter_requested')
        .gte('created_at', cutoffTime)

      if (recentEvents) {
        for (const ev of recentEvents) {
          recentValidPages.add(ev.session_id)
        }
      }
    } catch (err) {
      console.warn('Interpreter request verification notice:', err)
    }
  }

  // 3. Verify each session and auto-correct stale status
  for (const sess of sessions) {
    // If marked interpreter_connected, verify whether a LiveKit room with participants actually exists
    if (sess.status === 'interpreter_connected') {
      if (!activeLiveKitRooms.has(sess.id)) {
        sess.status = 'active'
        sess.active_mode = 'pictogram'
        if (supabase) {
          supabase
            .from('sessions')
            .update({ status: 'active', active_mode: 'pictogram' })
            .eq('id', sess.id)
            .then(() => {})
            .catch(() => {})
        }
      }
    }

    // If marked interpreter_requested, verify if it was paged within the 45-second window
    if (sess.status === 'interpreter_requested') {
      if (!recentValidPages.has(sess.id)) {
        sess.status = 'active'
        sess.active_mode = 'pictogram'
        if (supabase) {
          supabase
            .from('sessions')
            .update({ status: 'active', active_mode: 'pictogram' })
            .eq('id', sess.id)
            .then(() => {})
            .catch(() => {})
        }
      }
    }
  }

  return sessions
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const patientName = body.patientDisplayName || 'Bedside Patient'
    const hospitalId = body.hospitalId || 'a0000000-0000-0000-0000-000000000001'

    // Try Supabase service client
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()

        // Check if an active session already exists for this bed/patient name to prevent duplicates
        const { data: existing } = await supabase
          .from('sessions')
          .select('*')
          .eq('hospital_id', hospitalId)
          .eq('patient_display_name', patientName)
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existing) {
          return NextResponse.json({ session: existing, isExisting: true })
        }

        const { data, error } = await supabase
          .from('sessions')
          .insert({
            hospital_id: hospitalId,
            patient_display_name: patientName,
            status: 'active',
            active_mode: 'pictogram',
          })
          .select()
          .single()

        if (!error && data) {
          return NextResponse.json({ session: data })
        }
      } catch (err) {
        console.warn('Supabase session insert fallback to in-memory:', err)
      }
    }

    // Fallback: Generate local session UUID
    const id = crypto.randomUUID()
    const session = {
      id,
      hospital_id: hospitalId,
      patient_display_name: patientName,
      status: 'active',
      active_mode: 'pictogram',
      assigned_interpreter_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      closed_at: null,
    }

    inMemorySessions.set(id, session)

    return NextResponse.json({ session })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rawId = searchParams.get('id')
  const bedQuery = searchParams.get('bed') || searchParams.get('q')
  const listOnly = searchParams.get('list') === 'true'

  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabase = hasSupabase ? createServiceClient() : null

  // 1. Return roster of all active beds/sessions
  if (listOnly || (!rawId && !bedQuery)) {
    if (supabase) {
      try {
        const { data: list } = await supabase
          .from('sessions')
          .select('*')
          .neq('status', 'closed')
          .order('created_at', { ascending: false })

        if (list && list.length > 0) {
          // Deduplicate by patient_display_name to show clean unique beds
          const seen = new Set<string>()
          const unique = list.filter((s) => {
            const norm = (s.patient_display_name || '').trim().toLowerCase()
            if (seen.has(norm)) return false
            seen.add(norm)
            return true
          })

          const verifiedList = await verifyAndCorrectSessions(unique, supabase)
          return NextResponse.json({ sessions: verifiedList })
        }
      } catch (err) {
        console.warn('Failed to query sessions list from Supabase:', err)
      }
    }

    return NextResponse.json({
      sessions: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          hospital_id: 'a0000000-0000-0000-0000-000000000001',
          patient_display_name: 'Bed 4A - Ramesh Kumar (ISL)',
          status: 'active',
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          hospital_id: 'a0000000-0000-0000-0000-000000000001',
          patient_display_name: 'ICU Bed 2 - Sunita Patel (Deaf/Mute)',
          status: 'active',
        },
      ],
    })
  }

  // 2. Lookup by bed name query (e.g. 'Bed 2', '2', 'ICU Bed 2', 'Bed 5')
  // Also catches non-UUID values passed via ?id=
  const textQuery = (bedQuery || (!UUID_REGEX.test(rawId || '') ? rawId : '') || '').trim()
  if (textQuery && !UUID_REGEX.test(textQuery)) {
    if (supabase) {
      try {
        // Look for active session matching bed name (e.g. "Bed 5", "ICU Bed 2", "Bed 4A")
        const { data: matched } = await supabase
          .from('sessions')
          .select('*')
          .ilike('patient_display_name', `%${textQuery}%`)
          .neq('status', 'closed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (matched) {
          const [verified] = await verifyAndCorrectSessions([matched], supabase)
          return NextResponse.json({ session: verified || matched })
        }

        // If not found in DB, auto-create a new active session for this bed so the bedside tablet works immediately
        const formattedBed = textQuery.toLowerCase().startsWith('bed') || textQuery.toLowerCase().startsWith('icu')
          ? textQuery
          : `Bed ${textQuery}`

        const { data: created, error } = await supabase
          .from('sessions')
          .insert({
            hospital_id: 'a0000000-0000-0000-0000-000000000001',
            patient_display_name: `${formattedBed} (ISL)`,
            status: 'active',
            active_mode: 'pictogram',
          })
          .select()
          .single()

        if (!error && created) {
          return NextResponse.json({ session: created, created: true })
        }
      } catch (err) {
        console.warn('Error querying or creating bed session in Supabase:', err)
      }
    }

    // Check in-memory store
    for (const s of inMemorySessions.values()) {
      if (s.patient_display_name?.toLowerCase().includes(textQuery.toLowerCase())) {
        return NextResponse.json({ session: s })
      }
    }

    // In-memory fallback creation
    const newId = crypto.randomUUID()
    const formattedBed = textQuery.toLowerCase().startsWith('bed') ? textQuery : `Bed ${textQuery}`
    const fallbackBed = {
      id: newId,
      hospital_id: 'a0000000-0000-0000-0000-000000000001',
      patient_display_name: `${formattedBed} (ISL)`,
      status: 'active',
      active_mode: 'pictogram',
      created_at: new Date().toISOString(),
    }
    inMemorySessions.set(newId, fallbackBed)
    return NextResponse.json({ session: fallbackBed, created: true })
  }

  // 3. Lookup by exact UUID
  if (rawId && UUID_REGEX.test(rawId)) {
    const local = inMemorySessions.get(rawId)
    if (local) {
      return NextResponse.json({ session: local })
    }

    if (supabase) {
      try {
        const { data } = await supabase.from('sessions').select('*').eq('id', rawId).single()
        if (data) {
          const [verified] = await verifyAndCorrectSessions([data], supabase)
          return NextResponse.json({ session: verified || data })
        }
      } catch {}
    }
  }

  // 4. Default fallback to Bed 4A canonical session
  const defaultId = '00000000-0000-0000-0000-000000000001'
  if (supabase) {
    try {
      const { data } = await supabase.from('sessions').select('*').eq('id', defaultId).single()
      if (data) {
        const [verified] = await verifyAndCorrectSessions([data], supabase)
        return NextResponse.json({ session: verified || data })
      }
    } catch {}
  }

  return NextResponse.json({
    session: {
      id: defaultId,
      hospital_id: 'a0000000-0000-0000-0000-000000000001',
      patient_display_name: 'Bed 4A - Ramesh Kumar (ISL)',
      status: 'active',
      active_mode: 'pictogram',
      created_at: '2026-09-12T06:30:00.000Z',
    },
  })
}
