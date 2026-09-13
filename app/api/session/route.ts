import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { toValidSessionUuid } from '@/lib/realtime'

// In-memory fallback session store if DB unreachable
const inMemorySessions = new Map<string, any>()

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

  if (rawId) {
    const validUuid = toValidSessionUuid(rawId)

    // Check in-memory store first
    const local = inMemorySessions.get(validUuid) || inMemorySessions.get(rawId)
    if (local) {
      return NextResponse.json({ session: local })
    }

    // Query Supabase using service role to bypass patient RLS restriction
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
        const { data } = await supabase.from('sessions').select('*').eq('id', validUuid).single()
        if (data) return NextResponse.json({ session: data })
      } catch {}
    }
  }

  // Default to Bed 4A canonical session
  const defaultId = '00000000-0000-0000-0000-000000000001'
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient()
      const { data } = await supabase.from('sessions').select('*').eq('id', defaultId).single()
      if (data) return NextResponse.json({ session: data })
    } catch {}
  }

  const defaultSession = {
    id: defaultId,
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    patient_display_name: 'Bed 4A - Ramesh Kumar (ISL)',
    status: 'active',
    active_mode: 'pictogram',
    created_at: '2026-09-12T06:30:00.000Z',
  }

  return NextResponse.json({ session: defaultSession })
}
