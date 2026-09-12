import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// In-memory fallback session store for zero-friction local testing
const inMemorySessions = new Map<string, any>()

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const patientName = body.patientDisplayName || 'Bedside Patient'
    const hospitalId = body.hospitalId || 'a0000000-0000-0000-0000-000000000001'

    // Try Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createServiceClient()
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
      created_by: 'demo-doctor',
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
  const id = searchParams.get('id')

  if (id) {
    const local = inMemorySessions.get(id)
    if (local) {
      return NextResponse.json({ session: local })
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabase = await createClient()
        const { data } = await supabase.from('sessions').select().eq('id', id).single()
        if (data) return NextResponse.json({ session: data })
      } catch {}
    }
  }

  // Return demo default session if none found
  const demoId = 'demo-session-1'
  const session = inMemorySessions.get(demoId) || {
    id: demoId,
    hospital_id: 'a0000000-0000-0000-0000-000000000001',
    patient_display_name: 'Patient Bed 3B',
    status: 'active',
    active_mode: 'pictogram',
    created_at: new Date().toISOString(),
  }
  inMemorySessions.set(demoId, session)

  return NextResponse.json({ session })
}
